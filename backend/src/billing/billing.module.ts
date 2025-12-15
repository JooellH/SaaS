import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BusinessModule } from '../business/business.module';
import { StripeService } from './stripe.service';
import { MercadoPagoService } from './mercadopago.service';

@Module({
  imports: [PrismaModule, BusinessModule],
  controllers: [BillingController],
  providers: [BillingService, StripeService, MercadoPagoService],
  exports: [BillingService],
})
export class BillingModule {}
