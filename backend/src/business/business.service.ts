import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateBusinessDto) {
    const existing = await this.prisma.business.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) throw new ConflictException('Slug already taken');

    return this.prisma.business.create({
      data: {
        ...dto,
        ownerId: userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.business.findMany({
      where: { ownerId: userId },
    });
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
      include: { services: true, schedule: true },
    });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  async update(id: string, userId: string, dto: UpdateBusinessDto) {
    const business = await this.findOne(id);
    if (business.ownerId !== userId) throw new NotFoundException('Business not found');

    return this.prisma.business.update({
      where: { id },
      data: dto,
    });
  }
}
