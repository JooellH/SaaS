import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BusinessModule } from '../business/business.module';
import { StripeService } from './stripe.service';
import { MercadoPagoService } from './mercadopago.service';
import { ExchangeRateModule } from '../exchange-rate/exchange-rate.module';

@Module({
  imports: [PrismaModule, BusinessModule, ExchangeRateModule],
  controllers: [BillingController],
  providers: [BillingService, StripeService, MercadoPagoService],
  exports: [BillingService],
})
export class BillingModule {}
