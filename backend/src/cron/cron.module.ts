import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { CronController } from './cron.controller';
import { BookingModule } from '../booking/booking.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [BookingModule, WhatsappModule],
  controllers: [CronController],
  providers: [CronService],
})
export class CronModule {}
