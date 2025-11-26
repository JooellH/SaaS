import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { randomUUID } from 'crypto';
import { StaffStatus } from '@prisma/client';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async create(businessId: string, createStaffDto: CreateStaffDto) {
    // Check if staff already exists
    const existing = await this.prisma.staff.findFirst({
      where: {
        businessId,
        email: createStaffDto.email,
      },
    });

    if (existing) {
      throw new BadRequestException('Staff with this email already exists in this business');
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
    return this.prisma.staff.update({
      where: { id },
      data: updateStaffDto,
    });
  }

  async remove(id: string) {
    return this.prisma.staff.delete({
      where: { id },
    });
  }

  async acceptInvite(dto: AcceptInviteDto) {
    const staff = await this.prisma.staff.findUnique({
      where: { inviteToken: dto.token },
    });

    if (!staff) {
      throw new NotFoundException('Invalid invite token');
    }

    if (staff.status !== StaffStatus.PENDING) {
      throw new BadRequestException('Invite already accepted or invalid');
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
