import { Injectable, Logger } from '@nestjs/common';
import { BookingService } from '../booking/booking.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private bookingService: BookingService,
    private whatsappService: WhatsappService,
  ) {}

  async sendUpcomingReminders() {
    this.logger.log('Starting reminder cron job');

    try {
      // Find bookings in the next 60 minutes
      const bookings = await this.bookingService.findUpcomingReminders(60);

      this.logger.log(`Found ${bookings.length} bookings to remind`);

      for (const booking of bookings) {
        try {
          await this.whatsappService.sendReminder(booking.id);
          this.logger.log(`Reminder sent for booking ${booking.id}`);
        } catch (error) {
          this.logger.error(
            `Failed to send reminder for booking ${booking.id}: ${error.message}`,
          );
        }
      }

      return {
        success: true,
        processed: bookings.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Cron job failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
