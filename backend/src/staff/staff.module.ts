import { Module } from '@nestjs/common';
import { StaffService } from './staff.service';
import { StaffController, StaffPublicController } from './staff.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StaffController, StaffPublicController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule {}
