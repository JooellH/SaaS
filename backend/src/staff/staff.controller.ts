import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { AuthGuard } from '@nestjs/passport';
import { BusinessService } from '../business/business.service';
import type { Request as ExpressRequest } from 'express';

type AuthedRequest = ExpressRequest & {
  user: { userId: string; email?: string };
};

@Controller('business/:businessId/staff')
export class StaffController {
  constructor(
    private readonly staffService: StaffService,
    private readonly businessService: BusinessService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(
    @Request() req: AuthedRequest,
    @Param('businessId') businessId: string,
    @Body() createStaffDto: CreateStaffDto,
  ) {
    const role = await this.businessService.assertUserCanAccessBusiness(
      businessId,
      req.user.userId,
      req.user.email,
    );
    if (role !== 'OWNER') {
      throw new ForbiddenException('Solo el owner puede gestionar personal.');
    }
    return this.staffService.create(businessId, createStaffDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(
    @Request() req: AuthedRequest,
    @Param('businessId') businessId: string,
  ) {
    const role = await this.businessService.assertUserCanAccessBusiness(
      businessId,
      req.user.userId,
      req.user.email,
    );
    if (role !== 'OWNER') {
      throw new ForbiddenException('Solo el owner puede gestionar personal.');
    }
    return this.staffService.findAll(businessId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(
    @Request() req: AuthedRequest,
    @Param('businessId') businessId: string,
    @Param('id') id: string,
  ) {
    const role = await this.businessService.assertUserCanAccessBusiness(
      businessId,
      req.user.userId,
      req.user.email,
    );
    if (role !== 'OWNER') {
      throw new ForbiddenException('Solo el owner puede gestionar personal.');
    }
    const staff = await this.staffService.findOne(id);
    if (staff.businessId !== businessId) {
      throw new NotFoundException('Staff not found');
    }
    return staff;
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async update(
    @Request() req: AuthedRequest,
    @Param('businessId') businessId: string,
    @Param('id') id: string,
    @Body() updateStaffDto: UpdateStaffDto,
  ) {
    const role = await this.businessService.assertUserCanAccessBusiness(
      businessId,
      req.user.userId,
      req.user.email,
    );
    if (role !== 'OWNER') {
      throw new ForbiddenException('Solo el owner puede gestionar personal.');
    }
    const staff = await this.staffService.findOne(id);
    if (staff.businessId !== businessId) {
      throw new NotFoundException('Staff not found');
    }
    return this.staffService.update(id, updateStaffDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(
    @Request() req: AuthedRequest,
    @Param('businessId') businessId: string,
    @Param('id') id: string,
  ) {
    const role = await this.businessService.assertUserCanAccessBusiness(
      businessId,
      req.user.userId,
      req.user.email,
    );
    if (role !== 'OWNER') {
      throw new ForbiddenException('Solo el owner puede gestionar personal.');
    }
    const staff = await this.staffService.findOne(id);
    if (staff.businessId !== businessId) {
      throw new NotFoundException('Staff not found');
    }
    return this.staffService.remove(id);
  }
}

@Controller('staff')
export class StaffPublicController {
  constructor(private readonly staffService: StaffService) {}

  @Post('accept-invite')
  acceptInvite(@Body() acceptInviteDto: AcceptInviteDto) {
    return this.staffService.acceptInvite(acceptInviteDto);
  }
}
