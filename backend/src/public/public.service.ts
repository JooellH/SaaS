import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingService } from '../booking/booking.service';

@Injectable()
export class PublicService {
  constructor(
    private prisma: PrismaService,
    private bookingService: BookingService,
  ) {}

  async getBusinessBySlug(slug: string) {
    const business = await this.prisma.business.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        phoneNumber: true,
        timezone: true,
        logoUrl: true,
        bannerUrl: true,
        services: {
          select: {
            id: true,
            name: true,
            durationMinutes: true,
            price: true,
          },
        },
        schedules: {
          select: {
            weekday: true,
            intervals: true,
            isActive: true,
          },
          orderBy: {
            weekday: 'asc',
          },
        },
      },
    });

    if (!business) return null;

    const schedules = business.schedules.map((s) => {
      // Normalize intervals coming from Json -> typed array
      const intervals = Array.isArray(s.intervals)
        ? s.intervals
            .map((i) =>
              i && typeof i === 'object' && 'start' in i && 'end' in i
                ? {
                    start: (i as any).start as string,
                    end: (i as any).end as string,
                  }
                : null,
            )
            .filter((i): i is { start: string; end: string } => Boolean(i))
        : [];

      const first = intervals[0];
      const last = intervals[intervals.length - 1];
      return {
        weekday: s.weekday,
        isActive: s.isActive,
        intervals,
        openTime: first?.start || '-',
        closeTime: last?.end || '-',
      };
    });

    // Keep compatibility with older frontend expecting `schedule`
    return { ...business, schedule: schedules, schedules };
  }

  async getBookingsByClientKey(slug: string, clientKey: string) {
    if (!clientKey || typeof clientKey !== 'string') return [];

    const business = await this.prisma.business.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!business) return [];

    return this.prisma.booking.findMany({
      where: {
        businessId: business.id,
        metadata: {
          path: ['clientKey'],
          equals: clientKey,
        },
      },
      select: {
        id: true,
        serviceId: true,
        date: true,
        startTime: true,
        endTime: true,
        status: true,
        metadata: true,
        service: { select: { name: true, durationMinutes: true, price: true } },
      },
      orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
    });
  }

  private async requireClientBooking(
    slug: string,
    bookingId: string,
    clientKey: string,
  ) {
    if (!clientKey) throw new BadRequestException('clientKey required');

    const business = await this.prisma.business.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!business) throw new NotFoundException('Business not found');

    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        businessId: business.id,
        metadata: {
          path: ['clientKey'],
          equals: clientKey,
        },
      },
      select: { id: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async cancelClientBooking(
    slug: string,
    bookingId: string,
    clientKey: string,
  ) {
    await this.requireClientBooking(slug, bookingId, clientKey);
    return this.bookingService.cancel(bookingId, { cancelledBy: 'CLIENT' });
  }

  async rescheduleClientBooking(
    slug: string,
    bookingId: string,
    clientKey: string,
    date: string,
    startTime: string,
  ) {
    await this.requireClientBooking(slug, bookingId, clientKey);
    return this.bookingService.reschedule(bookingId, { date, startTime });
  }
}
