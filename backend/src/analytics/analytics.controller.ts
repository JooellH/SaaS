import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '@nestjs/passport';
import { BillingService } from '../billing/billing.service';
import { BusinessService } from '../business/business.service';
import type { Request as ExpressRequest } from 'express';

type AuthedRequest = ExpressRequest & { user: { userId: string; email?: string } };

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly billingService: BillingService,
    private readonly businessService: BusinessService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Get(':businessId')
  async getStats(
    @Request() req: AuthedRequest,
    @Param('businessId') businessId: string,
  ) {
    await this.businessService.assertUserCanAccessBusiness(
      businessId,
      req.user.userId,
      req.user.email,
    );
    await this.billingService.requirePro(
      businessId,
      'Analytics está disponible solo en el plan Pro.',
    );
    return this.analyticsService.getStats(businessId);
  }
}
