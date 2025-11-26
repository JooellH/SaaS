import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { RescheduleBookingDto } from './dto/reschedule-booking.dto';
import { addMinutes, parse, format } from 'date-fns';

@Injectable()
export class BookingService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBookingDto) {
    // Get service to calculate end time
    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
    });
    if (!service) throw new NotFoundException('Service not found');

    // Check availability
    const isAvailable = await this.checkAvailability(
      dto.businessId,
      dto.date,
      dto.startTime,
      service.durationMinutes + service.cleaningTimeMinutes,
    );

    if (!isAvailable) {
      throw new BadRequestException('Time slot not available');
    }

    // Calculate end time
    const startDate = parse(dto.startTime, 'HH:mm', new Date(dto.date));
    const endDate = addMinutes(startDate, service.durationMinutes);
    const endTime = format(endDate, 'HH:mm');

    const booking = await this.prisma.booking.create({
      data: {
        ...dto,
        date: new Date(dto.date),
        endTime,
        status: 'confirmed',
      },
      include: {
        service: true,
        business: true,
      },
    });

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

  async cancel(id: string) {
    return this.prisma.booking.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }

  async reschedule(id: string, dto: RescheduleBookingDto) {
    const booking = await this.findOne(id);

    const service = await this.prisma.service.findUnique({
      where: { id: booking.serviceId },
    });

    if (!service) throw new NotFoundException('Service not found');

    const isAvailable = await this.checkAvailability(
      booking.businessId,
      dto.date,
      dto.startTime,
      service.durationMinutes + service.cleaningTimeMinutes,
      id,
    );

    if (!isAvailable) {
      throw new BadRequestException('Time slot not available');
    }

    const startDate = parse(dto.startTime, 'HH:mm', new Date(dto.date));
    const endDate = addMinutes(startDate, service.durationMinutes);
    const endTime = format(endDate, 'HH:mm');

    return this.prisma.booking.update({
      where: { id },
      data: {
        date: new Date(dto.date),
        startTime: dto.startTime,
        endTime,
      },
    });
  }

  async checkAvailability(
    businessId: string,
    date: string,
    startTime: string,
    durationMinutes: number,
    excludeBookingId?: string,
  ): Promise<boolean> {
    const dateObj = new Date(date);
    const weekday = dateObj.getDay();

    // Check business schedule
    const schedule = await this.prisma.schedule.findFirst({
      where: {
        businessId,
        weekday,
      },
    });

    if (!schedule) return false;

    // Check if time is within business hours
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = startMinutes + durationMinutes;
    const openMinutes = this.timeToMinutes(schedule.openTime);
    const closeMinutes = this.timeToMinutes(schedule.closeTime);

    if (startMinutes < openMinutes || endMinutes > closeMinutes) {
      return false;
    }

    // Check break time
    if (schedule.breakStart && schedule.breakEnd) {
      const breakStartMinutes = this.timeToMinutes(schedule.breakStart);
      const breakEndMinutes = this.timeToMinutes(schedule.breakEnd);

      if (
        (startMinutes >= breakStartMinutes && startMinutes < breakEndMinutes) ||
        (endMinutes > breakStartMinutes && endMinutes <= breakEndMinutes) ||
        (startMinutes <= breakStartMinutes && endMinutes >= breakEndMinutes)
      ) {
        return false;
      }
    }

    // Check existing bookings
    const existingBookings = await this.prisma.booking.findMany({
      where: {
        businessId,
        date: dateObj,
        status: { not: 'cancelled' },
        ...(excludeBookingId && { id: { not: excludeBookingId } }),
      },
      include: {
        service: true,
      },
    });

    for (const booking of existingBookings) {
      const bookingStart = this.timeToMinutes(booking.startTime);
      const bookingEnd =
        this.timeToMinutes(booking.endTime) +
        booking.service.cleaningTimeMinutes;

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

    const dateObj = new Date(date);
    const weekday = dateObj.getDay();

    const schedule = await this.prisma.schedule.findFirst({
      where: { businessId, weekday },
    });

    if (!schedule) return [];

    const slots: string[] = [];
    const totalDuration = service.durationMinutes + service.cleaningTimeMinutes;
    const openMinutes = this.timeToMinutes(schedule.openTime);
    const closeMinutes = this.timeToMinutes(schedule.closeTime);

    for (
      let time = openMinutes;
      time + service.durationMinutes <= closeMinutes;
      time += 30
    ) {
      const timeStr = this.minutesToTime(time);
      const isAvailable = await this.checkAvailability(
        businessId,
        date,
        timeStr,
        totalDuration,
      );

      if (isAvailable) {
        slots.push(timeStr);
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

  async findUpcomingReminders(minutesAhead: number) {
    const now = new Date();
    const targetTime = addMinutes(now, minutesAhead);

    const bookings = await this.prisma.booking.findMany({
      where: { status: 'confirmed' },
      include: { service: true, business: true },
    });

    return bookings.filter((booking) => {
      const startDate = new Date(booking.date);
      const [hour, minute] = booking.startTime.split(':').map(Number);
      startDate.setHours(hour, minute, 0, 0);

      const timezone = booking.business.timezone || 'UTC';
      const startInZone = this.toDateInTimeZone(startDate, timezone);
      const nowInZone = this.toDateInTimeZone(now, timezone);
      const targetInZone = this.toDateInTimeZone(targetTime, timezone);

      return startInZone >= nowInZone && startInZone <= targetInZone;
    });
  }

  private toDateInTimeZone(date: Date, timeZone: string) {
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

    const find = (type: string) => parts.find((p) => p.type === type)?.value || '00';

    return new Date(
      `${find('year')}-${find('month')}-${find('day')}T${find('hour')}:${find('minute')}:${find('second')}Z`,
    );
  }
}
