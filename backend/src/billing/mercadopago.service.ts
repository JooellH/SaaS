import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import axios from 'axios';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BillingService } from './billing.service';

const BASIC_PLAN_ID = 'plan_basic';
const PRO_PLAN_ID = 'plan_pro';

type MercadoPagoWebhookRequest = Pick<ExpressRequest, 'body' | 'query'>;

type PreapprovalStatus = 'authorized' | 'paused' | 'cancelled' | 'finished';

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly apiBase = 'https://api.mercadopago.com';

  constructor(
    private readonly prisma: PrismaService,
    private readonly billingService: BillingService,
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

    const reason = `Suscripción Pro - Negocio ${input.businessId}`;

    const body = {
      reason,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: plan.price,
        currency_id: plan.currency ?? 'ARS',
      },
      back_url: `${frontendUrl}/panel/planes?businessId=${input.businessId}`,
      payer_email: input.customerEmail,
      external_reference: input.businessId,
    };

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
  }

  async handleWebhook(req: MercadoPagoWebhookRequest) {
    const { type, 'data.id': dataId } = (req.body || {}) as {
      type?: string;
      'data.id'?: string;
    };

    if (type !== 'preapproval' || !dataId) {
      this.logger.debug('Ignoring Mercado Pago webhook', req.body);
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
      this.logger.warn(
        `Mercado Pago preapproval ${preapproval.id} sin external_reference`,
      );
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
