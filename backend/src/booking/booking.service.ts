import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { RescheduleBookingDto } from './dto/reschedule-booking.dto';
import { addMinutes, endOfMonth, startOfMonth } from 'date-fns';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { BillingService } from '../billing/billing.service';
import { Prisma } from '@prisma/client';

type TimeInterval = {
  start: string;
  end: string;
};

@Injectable()
export class BookingService {
  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,
    private billingService: BillingService,
  ) {}

  private normalizeDateOnly(input: string): string {
    const dateOnly = input.split('T')[0] ?? input;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
      throw new BadRequestException('Invalid date');
    }
    return dateOnly;
  }

  private calendarDateToUtcDate(dateOnly: string): Date {
    const [year, month, day] = dateOnly.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  }

  private dayRangeUtc(dateOnly: string): { gte: Date; lt: Date } {
    const start = this.calendarDateToUtcDate(dateOnly);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { gte: start, lt: end };
  }

  private endTimeFromStart(startTime: string, durationMinutes: number): string {
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = startMinutes + durationMinutes;
    return this.minutesToTime(endMinutes);
  }

  private getTimeZoneOffsetMs(date: Date, timeZone: string): number {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(date);

    const find = (type: string) =>
      parts.find((p) => p.type === type)?.value ?? '00';

    const asUTC = new Date(
      `${find('year')}-${find('month')}-${find('day')}T${find('hour')}:${find('minute')}:${find('second')}Z`,
    );

    return asUTC.getTime() - date.getTime();
  }

  private zonedDateTimeToUtc(
    dateOnly: string,
    time: string,
    timeZone: string,
  ): Date {
    const [year, month, day] = dateOnly.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    const baseUtc = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));

    const offset1 = this.getTimeZoneOffsetMs(baseUtc, timeZone);
    let result = new Date(baseUtc.getTime() - offset1);

    const offset2 = this.getTimeZoneOffsetMs(result, timeZone);
    if (offset2 !== offset1) {
      result = new Date(baseUtc.getTime() - offset2);
    }

    return result;
  }

  async create(dto: CreateBookingDto) {
    // Get service to calculate end time
    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
    });
    if (!service) throw new NotFoundException('Service not found');

    const dateOnly = this.normalizeDateOnly(dto.date);
    await this.ensureMonthlyLimit(dto.businessId, dateOnly);

    // Check availability
    const isAvailable = await this.checkAvailability(
      dto.businessId,
      dateOnly,
      dto.startTime,
      service.durationMinutes,
    );

    if (!isAvailable) {
      throw new BadRequestException('Time slot not available');
    }

    // Calculate end time
    const endTime = this.endTimeFromStart(dto.startTime, service.durationMinutes);

    const booking = await this.prisma.booking.create({
      data: {
        ...dto,
        date: this.calendarDateToUtcDate(dateOnly),
        endTime,
        status: 'confirmed',
      },
      include: {
        service: true,
        business: true,
      },
    });

    try {
      await this.whatsappService.sendConfirmation(booking.id);
    } catch {
      // Do not fail booking on WhatsApp errors
    }

    return booking;
  }

  async findAll(businessId: string) {
    return this.prisma.booking.findMany({
      where: { businessId },
      include: {
        service: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        service: true,
        business: true,
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async cancel(
    id: string,
    opts?: {
      reason?: string;
      cancelledByUserId?: string;
      cancelledBy?: 'OWNER' | 'STAFF' | 'CLIENT';
    },
  ) {
    const existing = await this.prisma.booking.findUnique({
      where: { id },
      select: { metadata: true },
    });

    if (!existing) throw new NotFoundException('Booking not found');

    const baseMeta =
      typeof existing.metadata === 'object' &&
      existing.metadata !== null &&
      !Array.isArray(existing.metadata)
        ? (existing.metadata as Prisma.JsonObject)
        : ({} as Prisma.JsonObject);

    const cleanReason = opts?.reason?.trim();
    const nextMetadata: Prisma.JsonObject = {
      ...baseMeta,
      cancelledAt: new Date().toISOString(),
    };

    if (opts?.cancelledByUserId) {
      nextMetadata.cancelledByUserId = opts.cancelledByUserId;
    }
    if (opts?.cancelledBy) nextMetadata.cancelledBy = opts.cancelledBy;
    if (cleanReason) nextMetadata.cancellationReason = cleanReason;

    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: 'cancelled', metadata: nextMetadata },
    });

    try {
      await this.whatsappService.sendCancellation(id, cleanReason);
    } catch {
      // ignore WhatsApp errors
    }

    return updated;
  }

  async reschedule(id: string, dto: RescheduleBookingDto) {
    const booking = await this.findOne(id);

    const service = await this.prisma.service.findUnique({
      where: { id: booking.serviceId },
    });

    if (!service) throw new NotFoundException('Service not found');

    const dateOnly = this.normalizeDateOnly(dto.date);
    const isAvailable = await this.checkAvailability(
      booking.businessId,
      dateOnly,
      dto.startTime,
      service.durationMinutes,
      id,
    );

    if (!isAvailable) {
      throw new BadRequestException('Time slot not available');
    }

    const endTime = this.endTimeFromStart(dto.startTime, service.durationMinutes);

    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        date: this.calendarDateToUtcDate(dateOnly),
        startTime: dto.startTime,
        endTime,
      },
    });

    try {
      await this.whatsappService.sendConfirmation(id);
    } catch {
      // ignore WhatsApp errors
    }

    return updated;
  }

  async checkAvailability(
    businessId: string,
    date: string,
    startTime: string,
    durationMinutes: number,
    excludeBookingId?: string,
  ): Promise<boolean> {
    const dateOnly = this.normalizeDateOnly(date);
    const weekday = this.calendarDateToUtcDate(dateOnly).getUTCDay();

    // Check business schedule
    const schedule = await this.prisma.schedule.findFirst({
      where: {
        businessId,
        weekday,
        isActive: true,
      },
    });

    if (!schedule) return false;

    const intervals = this.parseIntervals(schedule.intervals);
    if (intervals.length === 0) return false;

    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = startMinutes + durationMinutes;

    const fitsSchedule = intervals.some(({ start, end }) => {
      const intervalStart = this.timeToMinutes(start);
      const intervalEnd = this.timeToMinutes(end);
      return startMinutes >= intervalStart && endMinutes <= intervalEnd;
    });

    if (!fitsSchedule) {
      return false;
    }

    // Check existing bookings
    const dayRange = this.dayRangeUtc(dateOnly);
    const existingBookings = await this.prisma.booking.findMany({
      where: {
        businessId,
        date: dayRange,
        status: { not: 'cancelled' },
        ...(excludeBookingId && { id: { not: excludeBookingId } }),
      },
    });

    for (const booking of existingBookings) {
      const bookingStart = this.timeToMinutes(booking.startTime);
      const bookingEnd = this.timeToMinutes(booking.endTime);

      if (
        (startMinutes >= bookingStart && startMinutes < bookingEnd) ||
        (endMinutes > bookingStart && endMinutes <= bookingEnd) ||
        (startMinutes <= bookingStart && endMinutes >= bookingEnd)
      ) {
        return false;
      }
    }

    return true;
  }

  async getAvailableSlots(businessId: string, serviceId: string, date: string) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) throw new NotFoundException('Service not found');

    const dateOnly = this.normalizeDateOnly(date);
    const weekday = this.calendarDateToUtcDate(dateOnly).getUTCDay();

    const schedule = await this.prisma.schedule.findFirst({
      where: { businessId, weekday, isActive: true },
    });

    if (!schedule) return [];

    const intervals = this.parseIntervals(schedule.intervals);
    if (intervals.length === 0) return [];

    const slots: string[] = [];
    const totalDuration = service.durationMinutes;

    for (const interval of intervals) {
      const intervalStart = this.timeToMinutes(interval.start);
      const intervalEnd = this.timeToMinutes(interval.end);

      for (
        let time = intervalStart;
        time + totalDuration <= intervalEnd;
        time += 30
      ) {
        const timeStr = this.minutesToTime(time);
        const isAvailable = await this.checkAvailability(
          businessId,
          dateOnly,
          timeStr,
          totalDuration,
        );

        if (isAvailable) {
          slots.push(timeStr);
        }
      }
    }

    return slots;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private parseIntervals(intervals: unknown): TimeInterval[] {
    if (!Array.isArray(intervals)) return [];

    return intervals
      .map((interval) => {
        if (
          interval &&
          typeof interval === 'object' &&
          'start' in interval &&
          'end' in interval &&
          typeof (interval as { start?: unknown }).start === 'string' &&
          typeof (interval as { end?: unknown }).end === 'string'
        ) {
          return {
            start: (interval as { start: string }).start,
            end: (interval as { end: string }).end,
          };
        }
        return null;
      })
      .filter((i): i is TimeInterval => Boolean(i));
  }

  private async ensureMonthlyLimit(businessId: string, date: string) {
    const dateOnly = this.normalizeDateOnly(date);
    const dateObj = this.calendarDateToUtcDate(dateOnly);
    const monthStart = startOfMonth(dateObj);
    const monthEnd = endOfMonth(dateObj);

    const currentCount = await this.prisma.booking.count({
      where: {
        businessId,
        date: { gte: monthStart, lte: monthEnd },
        status: { not: 'cancelled' },
      },
    });

    const canAdd = await this.billingService.checkLimit(
      businessId,
      'maxBookingsPerMonth',
      currentCount,
    );

    if (!canAdd) {
      throw new BadRequestException(
        'Has alcanzado el límite mensual de reservas de tu plan. Actualiza tu plan para recibir más reservas.',
      );
    }
  }

  async findUpcomingReminders(minutesAhead: number) {
    const now = new Date();
    const targetTime = addMinutes(now, minutesAhead);

    const bookings = await this.prisma.booking.findMany({
      where: {
        status: 'confirmed',
        messageLogs: {
          none: {
            type: 'reminder',
            status: 'sent',
          },
        },
      },
      include: { service: true, business: true },
    });

    return bookings.filter((booking) => {
      const timezone = booking.business.timezone || 'UTC';
      const dateOnly = booking.date.toISOString().slice(0, 10);
      const startUtc = this.zonedDateTimeToUtc(
        dateOnly,
        booking.startTime,
        timezone,
      );

      return startUtc >= now && startUtc <= targetTime;
    });
  }
}
