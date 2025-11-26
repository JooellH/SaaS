import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicService {
  constructor(private prisma: PrismaService) {}

  async getBusinessBySlug(slug: string) {
    return this.prisma.business.findUnique({
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
  }
}
