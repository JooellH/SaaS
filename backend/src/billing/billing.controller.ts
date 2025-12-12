import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { AuthGuard } from '@nestjs/passport';
import { BusinessService } from '../business/business.service';
import type { Request as ExpressRequest } from 'express';

type AuthedRequest = ExpressRequest & { user: { userId: string; email?: string } };

@Controller('billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly businessService: BusinessService,
  ) {}

  @Get('plans')
  getPlans() {
    return this.billingService.getPlans();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('subscription/:businessId')
  async getSubscription(
    @Request() req: AuthedRequest,
    @Param('businessId') businessId: string,
  ) {
    await this.businessService.assertUserCanAccessBusiness(
      businessId,
      req.user.userId,
      req.user.email,
    );
    return this.billingService.getAccess(businessId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('subscription/:businessId')
  async updateSubscription(
    @Request() req: AuthedRequest,
    @Param('businessId') businessId: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    const business = await this.businessService.findOne(businessId);
    if (business.ownerId !== req.user.userId) {
      throw new NotFoundException('Business not found');
    }

    return this.billingService.upsertSubscription(businessId, dto.planId);
  }
}
