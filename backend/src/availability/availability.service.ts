import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { addMinutes, format, parse, isBefore, isAfter, isSameDay } from 'date-fns';

type TimeInterval = {
  start: string;
  end: string;
};

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  async getAvailability(businessId: string, serviceId: string, dateStr: string) {
    const date = parse(dateStr, 'yyyy-MM-dd', new Date());
    const weekday = date.getDay(); // 0-6

    // 1. Get Service Details
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) throw new Error('Service not found');

    const totalDuration = service.durationMinutes + service.cleaningTimeMinutes;

    // 2. Get Schedule & Special Days
    const specialDay = await this.prisma.specialDay.findFirst({
      where: {
        businessId,
        date: date,
      },
    });

    if (specialDay && specialDay.isClosed) {
      return [];
    }

    let intervals: TimeInterval[] = [];
    if (specialDay && specialDay.intervals) {
      intervals = specialDay.intervals as TimeInterval[];
    } else {
      const schedule = await this.prisma.schedule.findUnique({
        where: {
          businessId_weekday: {
            businessId,
            weekday,
          },
        },
      });
      if (!schedule || !schedule.isActive) return [];
      intervals = schedule.intervals as TimeInterval[];
    }

    // 3. Get Existing Bookings
    const bookings = await this.prisma.booking.findMany({
      where: {
        businessId,
        date: date,
        status: { not: 'CANCELLED' },
      },
    });

    // 4. Generate Slots
    const availableSlots: string[] = [];
    const step = 15; // Granularity for start times (configurable?)

    for (const interval of intervals) {
      let currTime = parse(interval.start, 'HH:mm', date);
      const endTime = parse(interval.end, 'HH:mm', date);

      while (isBefore(addMinutes(currTime, totalDuration), endTime) || currTime.getTime() === endTime.getTime()) { // strict < or <= depends on if end is inclusive
        // Actually, if end is 12:00, and duration is 60m, last slot is 11:00.
        // So curr + duration <= end.
        if (isAfter(addMinutes(currTime, totalDuration), endTime)) {
           break;
        }

        const slotStart = format(currTime, 'HH:mm');
        const slotEnd = format(addMinutes(currTime, totalDuration), 'HH:mm');

        // Check collision
        const isOverlapping = bookings.some(booking => {
          const bStart = booking.startTime; // "HH:mm"
          const bEnd = booking.endTime;     // "HH:mm"
          
          // Simple string comparison works for HH:mm if 24h
          return (slotStart < bEnd && slotEnd > bStart);
        });

        if (!isOverlapping) {
          availableSlots.push(slotStart);
        }

        currTime = addMinutes(currTime, step);
      }
    }

    return availableSlots;
  }
}
