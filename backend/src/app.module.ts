import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { BusinessModule } from './business/business.module';
import { ServiceModule } from './service/service.module';
import { BookingModule } from './booking/booking.module';
import { ScheduleModule } from './schedule/schedule.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { CronModule } from './cron/cron.module';
import { PublicModule } from './public/public.module';
import { StaffModule } from './staff/staff.module';
import { LogsModule } from './logs/logs.module';
import { AvailabilityModule } from './availability/availability.module';
import { ExportModule } from './export/export.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { BillingModule } from './billing/billing.module';
import { ExchangeRateModule } from './exchange-rate/exchange-rate.module';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';
import { SecurityMiddleware } from './common/middleware/security.middleware';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    NestScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UserModule,
    BusinessModule,
    ServiceModule,
    BookingModule,
    ScheduleModule,
    WhatsappModule,
    CronModule,
    PublicModule,
    StaffModule,
    LogsModule,
    AvailabilityModule,
    ExportModule,
    AnalyticsModule,
    BillingModule,
    ExchangeRateModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimitMiddleware, SecurityMiddleware).forRoutes('*');
  }
}
