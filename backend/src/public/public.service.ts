import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicService {
  constructor(private prisma: PrismaService) {}

  async getBusinessBySlug(slug: string) {
    const business = await this.prisma.business.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        phoneNumber: true,
        timezone: true,
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
      const intervals = Array.isArray(s.intervals) ? s.intervals : [];
      const first = intervals[0];
      const last = intervals[intervals.length - 1];
      return {
        weekday: s.weekday,
        isActive: s.isActive,
        intervals,
        openTime: first?.start || null,
        closeTime: last?.end || null,
      };
    });

    return { ...business, schedules };
  }
}
