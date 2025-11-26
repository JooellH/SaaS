import { Controller, Get, Param } from '@nestjs/common';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('plans')
  getPlans() {
    return this.billingService.getPlans();
  }

  @Get('subscription/:businessId')
  getSubscription(@Param('businessId') businessId: string) {
    return this.billingService.getSubscription(businessId);
  }
}
