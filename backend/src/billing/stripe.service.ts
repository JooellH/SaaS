import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import Stripe from 'stripe';
import type { Request as ExpressRequest } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { BillingService } from './billing.service';
import type { Prisma } from '@prisma/client';

const BASIC_PLAN_ID = 'plan_basic';
const PRO_PLAN_ID = 'plan_pro';

type StripeWebhookRequest = Pick<ExpressRequest, 'headers' | 'body'>;

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly billingService: BillingService,
  ) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    this.stripe = secretKey ? new Stripe(secretKey) : null;
  }

  private getStripe(): Stripe {
    if (!this.stripe) {
      throw new ServiceUnavailableException(
        'Pagos no configurados. Definí STRIPE_SECRET_KEY y STRIPE_PRO_PRICE_ID en el backend.',
      );
    }
    return this.stripe;
  }

  private getProPriceId(): string {
    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    if (!priceId) {
      throw new ServiceUnavailableException(
        'Pagos no configurados. Definí STRIPE_PRO_PRICE_ID en el backend.',
      );
    }
    return priceId;
  }

  private getFrontendUrl(): string {
    const fromEnv =
      process.env.PUBLIC_FRONTEND_URL ??
      process.env.FRONTEND_URL?.split(',')[0] ??
      'http://localhost:4200';
    return fromEnv.trim().replace(/\/+$/, '');
  }

  private async ensureSubscriptionRow(businessId: string) {
    await this.billingService.getPlans();

    const existing = await this.prisma.subscription.findUnique({
      where: { businessId },
    });
    if (existing) return existing;

    return this.prisma.subscription.create({
      data: {
        businessId,
        planId: BASIC_PLAN_ID,
        status: 'ACTIVE',
        startDate: new Date(),
      },
    });
  }

  async createCheckoutSession(input: {
    businessId: string;
    customerEmail?: string;
  }) {
    const stripe = this.getStripe();
    const priceId = this.getProPriceId();
    const frontendUrl = this.getFrontendUrl();

    const subscriptionRow = await this.ensureSubscriptionRow(input.businessId);

    const customerId =
      subscriptionRow.stripeCustomerId ||
      (
        await stripe.customers.create({
          email: input.customerEmail,
          metadata: { businessId: input.businessId },
        })
      ).id;

    if (!subscriptionRow.stripeCustomerId) {
      await this.prisma.subscription.update({
        where: { businessId: input.businessId },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      client_reference_id: input.businessId,
      success_url: `${frontendUrl}/panel/planes?checkout=success&businessId=${input.businessId}`,
      cancel_url: `${frontendUrl}/panel/planes?checkout=cancel&businessId=${input.businessId}`,
      metadata: { businessId: input.businessId },
      subscription_data: {
        metadata: { businessId: input.businessId },
      },
    });

    if (!session.url) {
      throw new ServiceUnavailableException(
        'Stripe no devolvió URL de checkout.',
      );
    }

    return { url: session.url };
  }

  async createPortalSession(input: { businessId: string }) {
    const stripe = this.getStripe();
    const frontendUrl = this.getFrontendUrl();

    const subscriptionRow = await this.ensureSubscriptionRow(input.businessId);
    if (!subscriptionRow.stripeCustomerId) {
      throw new ServiceUnavailableException(
        'Este negocio no tiene cliente de Stripe asociado todavía.',
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscriptionRow.stripeCustomerId,
      return_url: `${frontendUrl}/panel/planes?businessId=${input.businessId}`,
    });

    return { url: session.url };
  }

  async handleWebhook(req: StripeWebhookRequest) {
    const stripe = this.getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new ServiceUnavailableException(
        'Stripe webhook no configurado (STRIPE_WEBHOOK_SECRET).',
      );
    }

    const signature = req.headers['stripe-signature'];
    if (!signature || typeof signature !== 'string') {
      throw new ServiceUnavailableException('Falta Stripe-Signature.');
    }

    const rawBody = req.body as Buffer;
    if (!Buffer.isBuffer(rawBody)) {
      throw new ServiceUnavailableException(
        'Webhook inválido: se esperaba body raw (Buffer).',
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (error) {
      const asError = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Webhook signature verification failed', asError);
      throw asError;
    }

    await this.billingService.getPlans();

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
          const session = event.data.object as Stripe.Checkout.Session;
          if (typeof session.subscription === 'string') {
            const subscription = await stripe.subscriptions.retrieve(
              session.subscription,
            );
            await this.applyStripeSubscription(subscription);
          }
          break;
        }
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
          const subscription = event.data.object as Stripe.Subscription;
          await this.applyStripeSubscription(subscription);
          break;
        }
        case 'invoice.paid':
        case 'invoice.payment_failed': {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
          const invoice = event.data.object as Stripe.Invoice;
          const subscriptionRef =
            invoice.parent?.subscription_details?.subscription;
          const subscriptionId =
            typeof subscriptionRef === 'string'
              ? subscriptionRef
              : subscriptionRef?.id;

          if (typeof subscriptionId === 'string' && subscriptionId) {
            const subscription =
              await stripe.subscriptions.retrieve(subscriptionId);
            await this.applyStripeSubscription(subscription);
          }
          break;
        }
        default:
          break;
      }
    } catch (error) {
      const asError = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Webhook handler failed for ${event.type}`, asError);
      throw asError;
    }

    return { received: true };
  }

  private mapStripeStatus(status: Stripe.Subscription.Status) {
    if (status === 'active' || status === 'trialing') return 'ACTIVE';
    if (status === 'past_due' || status === 'unpaid') return 'PAST_DUE';
    if (status === 'canceled' || status === 'incomplete_expired')
      return 'CANCELLED';
    if (status === 'incomplete') return 'PAST_DUE';
    return 'PAST_DUE';
  }

  private async applyStripeSubscription(subscription: Stripe.Subscription) {
    const businessId = subscription.metadata?.businessId;
    if (!businessId) {
      this.logger.warn(
        `Stripe subscription ${subscription.id} sin metadata.businessId`,
      );
      return;
    }

    const mappedStatus = this.mapStripeStatus(subscription.status);
    const planId = mappedStatus === 'ACTIVE' ? PRO_PLAN_ID : BASIC_PLAN_ID;

    const itemEnds = subscription.items?.data
      ?.map((item) => item.current_period_end)
      .filter((value) => typeof value === 'number') as number[] | undefined;
    const currentPeriodEndRaw =
      itemEnds && itemEnds.length > 0 ? Math.max(...itemEnds) : null;
    const currentPeriodEnd =
      typeof currentPeriodEndRaw === 'number'
        ? new Date(currentPeriodEndRaw * 1000)
        : null;

    const endDate =
      typeof subscription.canceled_at === 'number'
        ? new Date(subscription.canceled_at * 1000)
        : null;

    const startDate =
      typeof subscription.start_date === 'number'
        ? new Date(subscription.start_date * 1000)
        : new Date();

    const updateData: Prisma.SubscriptionUncheckedUpdateInput = {
      planId,
      status: mappedStatus,
      startDate,
      endDate,
      stripeCustomerId:
        typeof subscription.customer === 'string'
          ? subscription.customer
          : null,
      stripeSubscriptionId: subscription.id,
      currentPeriodEnd,
    };

    const createData: Prisma.SubscriptionUncheckedCreateInput = {
      businessId,
      planId,
      status: mappedStatus,
      startDate,
      endDate,
      stripeCustomerId:
        typeof subscription.customer === 'string'
          ? subscription.customer
          : null,
      stripeSubscriptionId: subscription.id,
      currentPeriodEnd,
    };

    await this.prisma.subscription.upsert({
      where: { businessId },
      update: updateData,
      create: createData,
    });
  }
}
