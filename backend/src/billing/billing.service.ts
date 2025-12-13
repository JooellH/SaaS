import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const TRIAL_DAYS = 7;
type PlanLimits = Record<string, number>;
const BASIC_PLAN_ID = 'plan_basic';
const PRO_PLAN_ID = 'plan_pro';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  private addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  private async ensureDefaultPlans() {
    await this.prisma.plan.upsert({
      where: { id: BASIC_PLAN_ID },
      update: {
        name: 'Básico',
        price: 0,
        currency: 'USD',
        limits: { maxStaff: 0, maxServices: 2, maxBookingsPerMonth: 20 },
      },
      create: {
        id: BASIC_PLAN_ID,
        name: 'Básico',
        price: 0,
        currency: 'USD',
        limits: { maxStaff: 0, maxServices: 2, maxBookingsPerMonth: 20 },
      },
    });

    await this.prisma.plan.upsert({
      where: { id: PRO_PLAN_ID },
      update: {
        name: 'Pro',
        price: 14.99,
        currency: 'USD',
        limits: { maxStaff: 10, maxServices: 30, maxBookingsPerMonth: 1000 },
      },
      create: {
        id: PRO_PLAN_ID,
        name: 'Pro',
        price: 14.99,
        currency: 'USD',
        limits: { maxStaff: 10, maxServices: 30, maxBookingsPerMonth: 1000 },
      },
    });
  }

  async getPlans() {
    await this.ensureDefaultPlans();
    return this.prisma.plan.findMany();
  }

  async getSubscription(businessId: string) {
    await this.ensureDefaultPlans();
    return this.prisma.subscription.findUnique({
      where: { businessId },
      include: { plan: true },
    });
  }

  async getAccess(businessId: string) {
    await this.ensureDefaultPlans();

    const [basicPlan, proPlan] = await Promise.all([
      this.prisma.plan.findUnique({ where: { id: BASIC_PLAN_ID } }),
      this.prisma.plan.findUnique({ where: { id: PRO_PLAN_ID } }),
    ]);

    if (!basicPlan || !proPlan) {
      throw new NotFoundException('Default plans not found');
    }

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: {
        owner: { select: { createdAt: true } },
        subscription: { include: { plan: true } },
      },
    });

    if (!business) throw new NotFoundException('Business not found');

    const now = new Date();
    const trialEndsAt = this.addDays(business.owner.createdAt, TRIAL_DAYS);
    const trialMsLeft = trialEndsAt.getTime() - now.getTime();
    const trialActive = trialMsLeft > 0;
    const trialDaysLeft = trialActive
      ? Math.max(1, Math.ceil(trialMsLeft / (1000 * 60 * 60 * 24)))
      : 0;

    const subscription = business.subscription ?? null;
    const paidActive =
      subscription?.status === 'ACTIVE' && subscription.planId !== BASIC_PLAN_ID
        ? subscription
        : null;

    const effectivePlan = paidActive
      ? paidActive.plan
      : trialActive
        ? proPlan
        : basicPlan;

    const trialExpired = !trialActive && !paidActive;

    return {
      subscription,
      trial: {
        daysTotal: TRIAL_DAYS,
        endsAt: trialEndsAt,
        isActive: trialActive,
        daysLeft: trialDaysLeft,
        isExpired: trialExpired,
      },
      effectivePlan,
      effectivePlanId: effectivePlan.id,
    };
  }

  async requirePro(businessId: string, reason?: string) {
    const access = await this.getAccess(businessId);
    if (access.effectivePlanId !== PRO_PLAN_ID) {
      throw new ForbiddenException(
        reason || 'Esta funcionalidad está disponible solo en el plan Pro.',
      );
    }
    return access;
  }

  // Helper to check limits
  async checkLimit(businessId: string, limitKey: string, currentCount: number) {
    const limits = await this.getPlanLimits(businessId);
    const limitValue = limits[limitKey];
    if (limitValue === undefined) return true;

    if (limitValue < 0) return true;

    return currentCount < limitValue;
  }

  private asNumberMap(value: unknown): PlanLimits {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return {};
    }

    const record = value as Record<string, unknown>;
    const result: PlanLimits = {};

    for (const [key, raw] of Object.entries(record)) {
      if (typeof raw === 'number' && Number.isFinite(raw)) {
        result[key] = raw;
      }
    }

    return result;
  }

  private async getPlanLimits(businessId: string): Promise<PlanLimits> {
    const access = await this.getAccess(businessId);
    return this.asNumberMap(access.effectivePlan.limits);
  }

  async upsertSubscription(businessId: string, planId: string) {
    await this.ensureDefaultPlans();
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) throw new NotFoundException('Plan not found');

    return this.prisma.subscription.upsert({
      where: { businessId },
      update: {
        planId: plan.id,
        status: 'ACTIVE',
      },
      create: {
        businessId,
        planId: plan.id,
        status: 'ACTIVE',
        startDate: new Date(),
      },
      include: { plan: true },
    });
  }
}
