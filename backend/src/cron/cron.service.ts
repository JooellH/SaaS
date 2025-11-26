import { Injectable, Logger } from '@nestjs/common';
import { BookingService } from '../booking/booking.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { LogsService } from '../logs/logs.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private bookingService: BookingService,
    private whatsappService: WhatsappService,
    private logsService: LogsService,
  ) {}

  async sendUpcomingReminders() {
    this.logger.log('Starting reminder cron job');

    try {
      // Find bookings in the next 24 hours (example) or configurable
      // Assuming findUpcomingReminders exists in BookingService. 
      // If not, we might need to implement it or use a different method.
      // For now, I'll assume it returns bookings that haven't been reminded yet.
      const bookings = await this.bookingService.findUpcomingReminders(24 * 60); 

      this.logger.log(`Found ${bookings.length} bookings to remind`);

      let successCount = 0;
      let failCount = 0;

      for (const booking of bookings) {
        try {
          await this.whatsappService.sendReminder(booking.id);
          this.logger.log(`Reminder sent for booking ${booking.id}`);
          successCount++;
        } catch (error) {
          failCount++;
          this.logger.error(
            `Failed to send reminder for booking ${booking.id}: ${error.message}`,
          );
          
          await this.logsService.createErrorLog({
            businessId: booking.businessId,
            source: 'CRON_REMINDER',
            error: error.message,
            stack: error.stack,
          });
        }
      }

      return {
        success: true,
        processed: bookings.length,
        successCount,
        failCount,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Cron job failed: ${error.message}`);
      
      await this.logsService.createErrorLog({
        source: 'CRON_SYSTEM',
        error: error.message,
        stack: error.stack,
      });

      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
  
  async getLogs(limit: number = 100) {
      // This might be redundant if we use LogsService directly, 
      // but the requirement asked for /cron/logs.
      // We can return system-wide error logs or specific cron logs.
      return this.logsService.getErrorLogs(undefined); // Pass undefined for system logs
  }
}

