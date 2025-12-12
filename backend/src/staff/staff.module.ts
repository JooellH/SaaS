import { Module } from '@nestjs/common';
import { StaffService } from './staff.service';
import { StaffController, StaffPublicController } from './staff.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [PrismaModule, BillingModule],
  controllers: [StaffController, StaffPublicController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule {}
