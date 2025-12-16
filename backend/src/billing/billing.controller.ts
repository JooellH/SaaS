import {
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { AuthGuard } from '@nestjs/passport';
import { BusinessService } from '../business/business.service';
import type { Request as ExpressRequest } from 'express';
import { StripeService } from './stripe.service';
import { MercadoPagoService } from './mercadopago.service';
import { Query } from '@nestjs/common';

type AuthedRequest = ExpressRequest & {
  user: { userId: string; email?: string };
};

@Controller('billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly businessService: BusinessService,
    private readonly stripeService: StripeService,
    private readonly mercadoPagoService: MercadoPagoService,
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
  @Post('checkout/:businessId')
  async createCheckoutSession(
    @Request() req: AuthedRequest,
    @Param('businessId') businessId: string,
    @Query('provider') provider = 'stripe',
  ) {
    const business = await this.businessService.findOne(businessId);
    if (business.ownerId !== req.user.userId) {
      throw new NotFoundException('Business not found');
    }

    const normalized = provider.toLowerCase();
    if (normalized === 'mercadopago') {
      return this.mercadoPagoService.createCheckoutSession({
        businessId,
        customerEmail: req.user.email,
      });
    }

    return this.stripeService.createCheckoutSession({
      businessId,
      customerEmail: req.user.email,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('portal/:businessId')
  async createPortalSession(
    @Request() req: AuthedRequest,
    @Param('businessId') businessId: string,
  ) {
    const business = await this.businessService.findOne(businessId);
    if (business.ownerId !== req.user.userId) {
      throw new NotFoundException('Business not found');
    }

    const subscription = await this.billingService.getSubscription(businessId);
    if (subscription?.provider === 'MERCADOPAGO') {
      throw new NotFoundException(
        'La suscripción con Mercado Pago se gestiona desde tu cuenta de Mercado Pago.',
      );
    }

    return this.stripeService.createPortalSession({ businessId });
  }

  @Post('webhook')
  handleStripeWebhook(@Request() req: ExpressRequest) {
    return this.stripeService.handleWebhook(req);
  }

  @Post('webhook/mercadopago')
  handleMercadoPagoWebhook(@Request() req: ExpressRequest) {
    return this.mercadoPagoService.handleWebhook(req);
  }
}
