import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getStats(businessId: string) {
    // 1. Total Bookings
    const totalBookings = await this.prisma.booking.count({
      where: { businessId },
    });

    // 2. Services Popularity
    const services = await this.prisma.booking.groupBy({
      by: ['serviceId'],
      where: { businessId },
      _count: {
        serviceId: true,
      },
      orderBy: {
        _count: {
          serviceId: 'desc',
        },
      },
      take: 5,
    });

    // Enrich with service names
    const popularServices = await Promise.all(services.map(async s => {
      const service = await this.prisma.service.findUnique({ where: { id: s.serviceId } });
      return { name: service?.name, count: s._count.serviceId };
    }));

    // 3. Cancellation Rate
    const cancelled = await this.prisma.booking.count({
      where: { businessId, status: 'CANCELLED' },
    });
    const cancellationRate = totalBookings > 0 ? (cancelled / totalBookings) * 100 : 0;

    // 4. Bookings by Status
    const byStatus = await this.prisma.booking.groupBy({
      by: ['status'],
      where: { businessId },
      _count: { status: true },
    });

    return {
      totalBookings,
      popularServices,
      cancellationRate,
      byStatus,
    };
  }
}
