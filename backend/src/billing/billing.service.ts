import { Injectable } from '@nestjs/common';
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
    const sub = await this.getSubscription(businessId);
    if (!sub || sub.status !== 'ACTIVE') return false; // Or default to free tier logic if applicable

    const limits = sub.plan.limits as any;
    if (!limits || limits[limitKey] === undefined) return true; // No limit defined means unlimited

    return currentCount < limits[limitKey];
  }
}
