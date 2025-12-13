import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { RescheduleBookingDto } from './dto/reschedule-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { AuthGuard } from '@nestjs/passport';
import { BusinessService } from '../business/business.service';
import type { Request as ExpressRequest } from 'express';

type AuthedRequest = ExpressRequest & {
  user: { userId: string; email?: string };
};

@Controller('bookings')
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly businessService: BusinessService,
  ) {}

  @Post()
  create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingService.create(createBookingDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':businessId')
  async findAll(
    @Request() req: AuthedRequest,
    @Param('businessId') businessId: string,
  ) {
    await this.businessService.assertUserCanAccessBusiness(
      businessId,
      req.user.userId,
      req.user.email,
    );
    return this.bookingService.findAll(businessId);
  }

  @Get(':businessId/availability')
  getAvailableSlots(
    @Param('businessId') businessId: string,
    @Query('serviceId') serviceId: string,
    @Query('date') date: string,
  ) {
    return this.bookingService.getAvailableSlots(businessId, serviceId, date);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/cancel')
  async cancel(
    @Request() req: AuthedRequest,
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
  ) {
    const booking = await this.bookingService.findOne(id);
    await this.businessService.assertUserCanAccessBusiness(
      booking.businessId,
      req.user.userId,
      req.user.email,
    );

    return this.bookingService.cancel(id, {
      reason: dto.reason,
      cancelledByUserId: req.user.userId,
      cancelledBy: 'OWNER',
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/reschedule')
  async reschedule(
    @Request() req: AuthedRequest,
    @Param('id') id: string,
    @Body() rescheduleDto: RescheduleBookingDto,
  ) {
    const booking = await this.bookingService.findOne(id);
    await this.businessService.assertUserCanAccessBusiness(
      booking.businessId,
      req.user.userId,
      req.user.email,
    );
    return this.bookingService.reschedule(id, rescheduleDto);
  }
}
