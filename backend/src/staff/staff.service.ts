import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { randomUUID } from 'crypto';
import { StaffStatus } from '@prisma/client';
import { BillingService } from '../billing/billing.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StaffService {
  constructor(
    private prisma: PrismaService,
    private billingService: BillingService,
  ) {}

  async create(businessId: string, createStaffDto: CreateStaffDto) {
    await this.billingService.requirePro(
      businessId,
      'Personal está disponible solo en el plan Pro.',
    );

    // Check if staff already exists
    const existing = await this.prisma.staff.findFirst({
      where: {
        businessId,
        email: createStaffDto.email,
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Staff with this email already exists in this business',
      );
    }

    const currentCount = await this.prisma.staff.count({
      where: { businessId },
    });

    const canAdd = await this.billingService.checkLimit(
      businessId,
      'maxStaff',
      currentCount,
    );

    if (!canAdd) {
      throw new BadRequestException(
        'Has alcanzado el límite de personal de tu plan. Actualiza tu plan para agregar más.',
      );
    }

    const token = randomUUID();

    const staff = await this.prisma.staff.create({
      data: {
        ...createStaffDto,
        businessId,
        inviteToken: token,
        status: StaffStatus.PENDING,
      },
    });

    // TODO: Send email with token
    console.log(`Invite token for ${staff.email}: ${token}`);

    return staff;
  }

  async findAll(businessId: string) {
    return this.prisma.staff.findMany({
      where: { businessId },
    });
  }

  async findOne(id: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
    });
    if (!staff) throw new NotFoundException('Staff not found');
    return staff;
  }

  async update(id: string, updateStaffDto: UpdateStaffDto) {
    const staff = await this.findOne(id);
    await this.billingService.requirePro(
      staff.businessId,
      'Personal está disponible solo en el plan Pro.',
    );
    return this.prisma.staff.update({
      where: { id },
      data: updateStaffDto,
    });
  }

  async remove(id: string) {
    const staff = await this.findOne(id);
    await this.billingService.requirePro(
      staff.businessId,
      'Personal está disponible solo en el plan Pro.',
    );
    return this.prisma.staff.delete({
      where: { id },
    });
  }

  async acceptInvite(dto: AcceptInviteDto) {
    const staff = await this.prisma.staff.findUnique({
      where: { inviteToken: dto.token },
    });

    if (!staff) {
      throw new NotFoundException('Token de invitación inválido');
    }

    if (staff.status !== StaffStatus.PENDING) {
      throw new BadRequestException(
        'La invitación ya fue aceptada o es inválida',
      );
    }

    await this.billingService.requirePro(
      staff.businessId,
      'La invitación expiró porque el negocio no tiene plan Pro activo.',
    );

    const existingUser = await this.prisma.user.findUnique({
      where: { email: staff.email },
    });

    if (!existingUser) {
      if (!dto.password) {
        throw new BadRequestException(
          'Necesitás definir una contraseña para crear tu acceso.',
        );
      }

      const hashedPassword = await bcrypt.hash(dto.password, 10);
      await this.prisma.user.create({
        data: {
          name: dto.name?.trim() || staff.name,
          email: staff.email,
          password: hashedPassword,
        },
      });
    }

    return this.prisma.staff.update({
      where: { id: staff.id },
      data: {
        status: StaffStatus.ACTIVE,
        inviteToken: null,
      },
    });
  }
}
