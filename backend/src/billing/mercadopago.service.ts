import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import axios from 'axios';
import type { Prisma } from '@prisma/client';
import { createHmac } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { BillingService } from './billing.service';
import { ExchangeRateService } from '../exchange-rate/exchange-rate.service';

const BASIC_PLAN_ID = 'plan_basic';
const PRO_PLAN_ID = 'plan_pro';

export type MercadoPagoWebhookRequest = Pick<
  ExpressRequest,
  'body' | 'query' | 'headers'
>;

type PreapprovalStatus = 'authorized' | 'paused' | 'cancelled' | 'finished';

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly apiBase = 'https://api.mercadopago.com';

  constructor(
    private readonly prisma: PrismaService,
    private readonly billingService: BillingService,
    private readonly exchangeRateService: ExchangeRateService,
  ) {}

  private getAccessToken(): string {
    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) {
      throw new ServiceUnavailableException(
        'Pagos con Mercado Pago no configurados. Definí MP_ACCESS_TOKEN en el backend.',
      );
    }
    return token;
  }

  private getFrontendUrl(): string {
    const fromEnv =
      process.env.PUBLIC_FRONTEND_URL ??
      process.env.FRONTEND_URL?.split(',')[0] ??
      'http://localhost:4200';
    return fromEnv.trim().replace(/\/+$/, '');
  }

  private getMPWebhookSecret(): string {
    const secret = process.env.MP_WEBHOOK_SECRET;
    if (!secret) {
      this.logger.warn(
        'MP_WEBHOOK_SECRET not configured. Webhooks will not be validated.',
      );
      return '';
    }
    return secret;
  }

  private validateWebhookSignature(req: MercadoPagoWebhookRequest): boolean {
    const secret = this.getMPWebhookSecret();
    if (!secret) {
      // Si no hay secret configurado, logueamos una advertencia pero permitimos el webhook
      this.logger.warn(
        'Webhook validation skipped: MP_WEBHOOK_SECRET not configured',
      );
      return true;
    }

    const xSignature = (req.headers?.['x-signature'] as string) || '';
    const xRequestId = (req.headers?.['x-request-id'] as string) || '';

    if (!xSignature || !xRequestId) {
      this.logger.error('Missing webhook headers: x-signature or x-request-id');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    // Obtener el timestamp de la query
    const timestamp = (req.query?.timestamp as string) || '';
    if (!timestamp) {
      this.logger.error('Missing timestamp in webhook query');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    // Construir el string para firmar: id.timestamp
    const dataToSign = `${xRequestId}.${timestamp}`;

    // Calcular HMAC-SHA256
    const hmac = createHmac('sha256', secret);
    hmac.update(dataToSign);
    const signature = hmac.digest('hex');

    // Comparar firmas
    if (signature !== xSignature) {
      this.logger.error(
        `Invalid webhook signature. Expected: ${signature}, Got: ${xSignature}`,
      );
      throw new UnauthorizedException('Invalid webhook signature');
    }

    this.logger.debug('Webhook signature validated successfully');
    return true;
  }

  async createCheckoutSession(input: {
    businessId: string;
    customerEmail?: string;
  }) {
    const frontendUrl = this.getFrontendUrl();
    await this.billingService.getPlans();

    const plan = await this.prisma.plan.findUnique({
      where: { id: PRO_PLAN_ID },
    });

    if (!plan) {
      throw new ServiceUnavailableException('Plan Pro no encontrado.');
    }

    const accessToken = this.getAccessToken();

    // Convert price to ARS
    const rate = await this.exchangeRateService.getRate('ARS');
    const amountInArs = Math.round(plan.price * rate * 100) / 100; // Plan price (USD) * Rate

    const reason = `Suscripción Pro - Reserva`;

    const body = {
      reason,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: amountInArs,
        currency_id: 'ARS',
        start_date: new Date().toISOString(), // Required field
      },
      back_url: `${frontendUrl}/panel/planes?businessId=${input.businessId}&checkout=success`,
      notification_url: `${process.env.PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? 'http://localhost:3000'}/billing/webhook/mercadopago`,
      payer_email: input.customerEmail || 'no-email@example.com', // MP requires email
      external_reference: input.businessId,
    };

    try {
      const response = await axios.post(`${this.apiBase}/preapproval`, body, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const { init_point, sandbox_init_point, id } = response.data as {
        init_point?: string;
        sandbox_init_point?: string;
        id: string;
      };

      const url = init_point || sandbox_init_point;
      if (!url) {
        throw new ServiceUnavailableException(
          'Mercado Pago no devolvió URL de checkout.',
        );
      }

      // Guardamos mpPreapprovalId en la suscripción local para referencia
      const updateData = {
        planId: PRO_PLAN_ID,
        status: 'ACTIVE',
        mpPreapprovalId: id,
      } as unknown as Prisma.SubscriptionUncheckedUpdateInput;

      const createData = {
        businessId: input.businessId,
        planId: PRO_PLAN_ID,
        status: 'ACTIVE',
        startDate: new Date(),
        mpPreapprovalId: id,
      } as unknown as Prisma.SubscriptionUncheckedCreateInput;

      await this.prisma.subscription.upsert({
        where: { businessId: input.businessId },
        update: updateData,
        create: createData,
      });

      return { url };
    } catch (error) {
      const axiosError = error as any;
      if (axiosError.response?.status === 400) {
        this.logger.error(
          'Mercado Pago validation error:',
          axiosError.response.data,
        );
        throw new ServiceUnavailableException(
          `Error en Mercado Pago: ${axiosError.response.data?.message || 'Invalid request'}`,
        );
      }
      throw error;
    }
  }

  async handleWebhook(req: MercadoPagoWebhookRequest) {
    // Validar firma del webhook
    this.validateWebhookSignature(req);

    const { type, 'data.id': dataId } = (req.body || {}) as {
      type?: string;
      'data.id'?: string;
    };

    if (type !== 'preapproval' || !dataId) {
      return { received: true };
    }

    const accessToken = this.getAccessToken();

    const response = await axios.get(`${this.apiBase}/preapproval/${dataId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const preapproval = response.data as {
      id: string;
      external_reference?: string;
      status: PreapprovalStatus;
      auto_recurring?: {
        next_payment_date?: string;
      };
      date_created?: string;
      date_finish?: string | null;
    };

    const businessId = preapproval.external_reference;
    if (!businessId) {
      return { received: true };
    }

    await this.billingService.getPlans();

    const mappedStatus =
      preapproval.status === 'authorized'
        ? 'ACTIVE'
        : preapproval.status === 'paused'
          ? 'PAST_DUE'
          : 'CANCELLED';

    const planId = mappedStatus === 'ACTIVE' ? PRO_PLAN_ID : BASIC_PLAN_ID;

    const startDate = preapproval.date_created
      ? new Date(preapproval.date_created)
      : new Date();

    const endDate = preapproval.date_finish
      ? new Date(preapproval.date_finish)
      : null;

    const currentPeriodEnd = preapproval.auto_recurring?.next_payment_date
      ? new Date(preapproval.auto_recurring.next_payment_date)
      : null;

    const updateData = {
      planId,
      status: mappedStatus,
      startDate,
      endDate,
      currentPeriodEnd,
      mpPreapprovalId: preapproval.id,
    } as unknown as Prisma.SubscriptionUncheckedUpdateInput;

    const createData = {
      businessId,
      planId,
      status: mappedStatus,
      startDate,
      endDate,
      currentPeriodEnd,
      mpPreapprovalId: preapproval.id,
    } as unknown as Prisma.SubscriptionUncheckedCreateInput;

    await this.prisma.subscription.upsert({
      where: { businessId },
      update: updateData,
      create: createData,
    });

    return { received: true };
  }
}
