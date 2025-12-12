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

  @Get('subscription/:businessId')
  getSubscription(@Param('businessId') businessId: string) {
    return this.billingService.getSubscription(businessId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('subscription/:businessId')
  async updateSubscription(
    @Request() req,
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
