import { Controller, Post } from '@nestjs/common';
import { CronService } from './cron.service';

@Controller('cron')
export class CronController {
  constructor(private readonly cronService: CronService) {}

  @Post('send-reminders')
  sendReminders() {
    return this.cronService.sendUpcomingReminders();
  }
}
