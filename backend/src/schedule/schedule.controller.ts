import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  BadRequestException,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { AuthGuard } from '@nestjs/passport';
import { BillingService } from '../billing/billing.service';
import { BusinessService } from '../business/business.service';
import type { Request as ExpressRequest } from 'express';

type AuthedRequest = ExpressRequest & { user: { userId: string; email?: string } };

@Controller('business/:businessId/schedule')
export class ScheduleController {
  constructor(
    private readonly scheduleService: ScheduleService,
    private readonly billingService: BillingService,
    private readonly businessService: BusinessService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(
    @Request() req: AuthedRequest,
    @Param('businessId') businessId: string,
    @Body() createScheduleDto: CreateScheduleDto,
  ) {
    await this.businessService.assertUserCanAccessBusiness(
      businessId,
      req.user.userId,
      req.user.email,
    );
    if (
      Array.isArray(createScheduleDto.intervals) &&
      createScheduleDto.intervals.length > 1
    ) {
      await this.billingService.requirePro(
        businessId,
        'Pausas (intervalos múltiples) están disponibles solo en el plan Pro.',
      );
    }
    return this.scheduleService.create(businessId, createScheduleDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(
    @Request() req: AuthedRequest,
    @Param('businessId') businessId: string,
  ) {
    await this.businessService.assertUserCanAccessBusiness(
      businessId,
      req.user.userId,
      req.user.email,
    );
    return this.scheduleService.findAll(businessId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(
    @Request() req: AuthedRequest,
    @Param('businessId') businessId: string,
    @Param('id') id: string,
  ) {
    await this.businessService.assertUserCanAccessBusiness(
      businessId,
      req.user.userId,
      req.user.email,
    );
    const schedule = await this.scheduleService.findOne(id);
    if (schedule.businessId !== businessId) {
      throw new NotFoundException('Schedule not found');
    }
    return schedule;
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async update(
    @Request() req: AuthedRequest,
    @Param('businessId') businessId: string,
    @Param('id') id: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ) {
    await this.businessService.assertUserCanAccessBusiness(
      businessId,
      req.user.userId,
      req.user.email,
    );
    const schedule = await this.scheduleService.findOne(id);
    if (schedule.businessId !== businessId) {
      throw new NotFoundException('Schedule not found');
    }
    return this.scheduleService.update(id, updateScheduleDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(
    @Request() req: AuthedRequest,
    @Param('businessId') businessId: string,
    @Param('id') id: string,
  ) {
    await this.businessService.assertUserCanAccessBusiness(
      businessId,
      req.user.userId,
      req.user.email,
    );
    const schedule = await this.scheduleService.findOne(id);
    if (schedule.businessId !== businessId) {
      throw new NotFoundException('Schedule not found');
    }
    return this.scheduleService.remove(id);
  }

  // Special Days
  @UseGuards(AuthGuard('jwt'))
  @Post('special-days')
  async addSpecialDay(
    @Request() req: AuthedRequest,
    @Param('businessId') businessId: string,
    @Body()
    body: { date: string; isClosed: boolean; intervals?: any; reason?: string },
  ) {
    await this.businessService.assertUserCanAccessBusiness(
      businessId,
      req.user.userId,
      req.user.email,
    );
    await this.billingService.requirePro(
      businessId,
      'Días especiales están disponibles solo en el plan Pro.',
    );
    const date = new Date(body.date);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Fecha inválida');
    }
    return this.scheduleService.addSpecialDay(
      businessId,
      date,
      body.isClosed,
      body.intervals,
      body.reason,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('special-days')
  async getSpecialDays(
    @Request() req: AuthedRequest,
    @Param('businessId') businessId: string,
  ) {
    await this.businessService.assertUserCanAccessBusiness(
      businessId,
      req.user.userId,
      req.user.email,
    );
    await this.billingService.requirePro(
      businessId,
      'Días especiales están disponibles solo en el plan Pro.',
    );
    return this.scheduleService.getSpecialDays(businessId);
  }
}
