import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  addMinutes,
  format,
  parse,
  isBefore,
  isAfter,
  isSameDay,
} from 'date-fns';

type TimeInterval = {
  start: string;
  end: string;
};

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  async getAvailability(
    businessId: string,
    serviceId: string,
    dateStr: string,
  ) {
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
      intervals = Array.isArray(specialDay.intervals)
        ? (specialDay.intervals as TimeInterval[])
        : [];
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
      intervals = Array.isArray(schedule.intervals)
        ? (schedule.intervals as TimeInterval[])
        : [];
    }

    // 3. Get Existing Bookings
    const bookings = await this.prisma.booking.findMany({
      where: {
        businessId,
        date: date,
        status: { not: 'cancelled' },
      },
      include: {
        service: true,
      },
    });

    // 4. Generate Slots
    const availableSlots: string[] = [];
    const step = 15; // Granularity for start times (configurable?)

    for (const interval of intervals) {
      let currTime = parse(interval.start, 'HH:mm', date);
      const endTime = parse(interval.end, 'HH:mm', date);

      while (
        isBefore(addMinutes(currTime, totalDuration), endTime) ||
        currTime.getTime() === endTime.getTime()
      ) {
        // strict < or <= depends on if end is inclusive
        // Actually, if end is 12:00, and duration is 60m, last slot is 11:00.
        // So curr + duration <= end.
        if (isAfter(addMinutes(currTime, totalDuration), endTime)) {
          break;
        }

        const slotStart = format(currTime, 'HH:mm');
        const slotEnd = format(addMinutes(currTime, totalDuration), 'HH:mm');

        // Check collision
        const isOverlapping = bookings.some((booking) => {
          const bStart = this.timeToMinutes(booking.startTime); // "HH:mm"
          const bEnd =
            this.timeToMinutes(booking.endTime) +
            (booking.service?.cleaningTimeMinutes || 0);

          const slotStartMin = this.timeToMinutes(slotStart);
          const slotEndMin = this.timeToMinutes(slotEnd);

          return slotStartMin < bEnd && slotEndMin > bStart;
        });

        if (!isOverlapping) {
          availableSlots.push(slotStart);
        }

        currTime = addMinutes(currTime, step);
      }
    }

    return availableSlots;
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }
}
