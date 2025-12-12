import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { BillingService } from '../billing/billing.service';

@Injectable()
export class ServiceService {
  constructor(
    private prisma: PrismaService,
    private billingService: BillingService,
  ) {}

  async create(dto: CreateServiceDto) {
    const currentCount = await this.prisma.service.count({
      where: { businessId: dto.businessId },
    });

    const canAdd = await this.billingService.checkLimit(
      dto.businessId,
      'maxServices',
      currentCount,
    );

    if (!canAdd) {
      throw new BadRequestException(
        'Has alcanzado el límite de servicios de tu plan. Actualiza tu plan para agregar más.',
      );
    }

    return this.prisma.service.create({
      data: dto,
    });
  }

  async findAll(businessId: string) {
    return this.prisma.service.findMany({
      where: { businessId },
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async update(id: string, dto: UpdateServiceDto) {
    return this.prisma.service.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    return this.prisma.service.delete({
      where: { id },
    });
  }
}
