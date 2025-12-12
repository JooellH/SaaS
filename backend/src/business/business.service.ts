import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { StaffStatus } from '@prisma/client';

const TRIAL_DAYS = 7;
const PRO_PLAN_ID = 'plan_pro';

@Injectable()
export class BusinessService {
  constructor(private prisma: PrismaService) {}

  private addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  private subDays(date: Date, days: number) {
    const next = new Date(date);
    next.setDate(next.getDate() - days);
    return next;
  }

  async assertUserCanAccessBusiness(
    businessId: string,
    userId: string,
    email?: string,
  ): Promise<'OWNER' | 'STAFF'> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: {
        owner: { select: { createdAt: true } },
        subscription: { select: { status: true, planId: true } },
        staff: email
          ? {
              where: { email, status: StaffStatus.ACTIVE },
              select: { id: true },
              take: 1,
            }
          : false,
      },
    });

    if (!business) throw new NotFoundException('Business not found');

    if (business.ownerId === userId) return 'OWNER';

    const isStaff = Array.isArray(business.staff) && business.staff.length > 0;
    if (!isStaff) throw new NotFoundException('Business not found');

    const subscriptionActivePro =
      business.subscription?.status === 'ACTIVE' &&
      business.subscription?.planId === PRO_PLAN_ID;

    const trialActive = new Date() < this.addDays(business.owner.createdAt, TRIAL_DAYS);

    if (!subscriptionActivePro && !trialActive) {
      throw new NotFoundException('Business not found');
    }

    return 'STAFF';
  }

  async create(userId: string, dto: CreateBusinessDto) {
    const existing = await this.prisma.business.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) throw new ConflictException('Slug already taken');

    const basicPlan = await this.prisma.plan.findUnique({
      where: { id: 'plan_basic' },
    });

    const data: any = {
      ...dto,
      ownerId: userId,
    };

    if (basicPlan) {
      data.subscription = {
        create: {
          planId: basicPlan.id,
          status: 'ACTIVE',
          startDate: new Date(),
        },
      };
    }

    return this.prisma.business.create({ data });
  }

  async findAll(userId: string, email?: string) {
    if (!email) {
      return this.prisma.business.findMany({ where: { ownerId: userId } });
    }

    const trialThreshold = this.subDays(new Date(), TRIAL_DAYS);

    const where = {
      OR: [
        { ownerId: userId },
        {
          AND: [
            {
              staff: {
                some: {
                  email,
                  status: StaffStatus.ACTIVE,
                },
              },
            },
            {
              OR: [
                {
                  subscription: {
                    is: {
                      status: 'ACTIVE',
                      planId: PRO_PLAN_ID,
                    },
                  },
                },
                {
                  owner: {
                    createdAt: { gte: trialThreshold },
                  },
                },
              ],
            },
          ],
        },
      ],
    };

    return this.prisma.business.findMany({ where });
  }

  async findOne(id: string) {
    const business = await this.prisma.business.findUnique({
      where: { id },
    });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  async findBySlug(slug: string) {
    const business = await this.prisma.business.findUnique({
      where: { slug },
      include: { services: true, schedules: true },
    });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  async update(id: string, userId: string, dto: UpdateBusinessDto) {
    const business = await this.findOne(id);
    if (business.ownerId !== userId)
      throw new NotFoundException('Business not found');

    return this.prisma.business.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string) {
    const business = await this.findOne(id);
    if (business.ownerId !== userId)
      throw new NotFoundException('Business not found');

    await this.prisma.$transaction(async (tx) => {
      const bookingIds = (
        await tx.booking.findMany({
          where: { businessId: id },
          select: { id: true },
        })
      ).map((b) => b.id);

      if (bookingIds.length > 0) {
        await tx.messageLog.deleteMany({
          where: { bookingId: { in: bookingIds } },
        });
      }

      await tx.booking.deleteMany({ where: { businessId: id } });
      await tx.schedule.deleteMany({ where: { businessId: id } });
      await tx.service.deleteMany({ where: { businessId: id } });
      await tx.staff.deleteMany({ where: { businessId: id } });
      await tx.business.delete({ where: { id } });
    });

    return { success: true };
  }
}
