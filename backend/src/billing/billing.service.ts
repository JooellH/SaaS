import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  async getPlans() {
    return this.prisma.plan.findMany();
  }

  async getSubscription(businessId: string) {
    return this.prisma.subscription.findUnique({
      where: { businessId },
      include: { plan: true },
    });
  }

  // Helper to check limits
  async checkLimit(businessId: string, limitKey: string, currentCount: number) {
    const limits = await this.getPlanLimits(businessId);
    if (!limits || limits[limitKey] === undefined) return true;

    const limitValue = Number(limits[limitKey]);
    if (Number.isNaN(limitValue) || limitValue < 0) return true;

    return currentCount < limitValue;
  }

  private async getPlanLimits(businessId: string) {
    const sub = await this.getSubscription(businessId);
    if (sub?.plan?.limits) return sub.plan.limits as any;

    const basicPlan = await this.prisma.plan.findUnique({
      where: { id: 'plan_basic' },
    });
    return basicPlan?.limits as any | undefined;
  }

  async upsertSubscription(businessId: string, planId: string) {
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
