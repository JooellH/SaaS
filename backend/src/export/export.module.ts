import { Module } from '@nestjs/common';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BillingModule } from '../billing/billing.module';
import { BusinessModule } from '../business/business.module';

@Module({
  imports: [PrismaModule, BillingModule, BusinessModule],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
