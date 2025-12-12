import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  async create(businessId: string, createScheduleDto: CreateScheduleDto) {
    // Check if schedule for weekday exists
    const existing = await this.prisma.schedule.findUnique({
      where: {
        businessId_weekday: {
          businessId,
          weekday: createScheduleDto.weekday,
        },
      },
    });

    if (existing) {
      return this.update(existing.id, createScheduleDto);
    }

    return this.prisma.schedule.create({
      data: {
        ...createScheduleDto,
        businessId,
        intervals: createScheduleDto.intervals as any,
      },
    });
  }

  async findAll(businessId: string) {
    return this.prisma.schedule.findMany({
      where: { businessId },
      orderBy: { weekday: 'asc' },
    });
  }

  async findOne(id: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
    });
    if (!schedule) throw new NotFoundException('Schedule not found');
    return schedule;
  }

  async update(id: string, updateScheduleDto: UpdateScheduleDto) {
    return this.prisma.schedule.update({
      where: { id },
      data: {
        ...updateScheduleDto,
        intervals: updateScheduleDto.intervals as any,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.schedule.delete({
      where: { id },
    });
  }

  // Special Days
  async addSpecialDay(
    businessId: string,
    date: Date,
    isClosed: boolean,
    intervals?: any,
    reason?: string,
  ) {
    return this.prisma.specialDay.create({
      data: {
        businessId,
        date,
        isClosed,
        intervals: intervals || [],
        reason,
      },
    });
  }

  async getSpecialDays(businessId: string) {
    return this.prisma.specialDay.findMany({
      where: { businessId },
      orderBy: { date: 'asc' },
    });
  }
}
