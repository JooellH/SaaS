import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { RescheduleBookingDto } from './dto/reschedule-booking.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingService.create(createBookingDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':businessId')
  findAll(@Param('businessId') businessId: string) {
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
  cancel(@Param('id') id: string) {
    return this.bookingService.cancel(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/reschedule')
  reschedule(
    @Param('id') id: string,
    @Body() rescheduleDto: RescheduleBookingDto,
  ) {
    return this.bookingService.reschedule(id, rescheduleDto);
  }
}
