import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { PublicService } from './public.service';
import { PublicBookingCancelDto } from './dto/public-booking-cancel.dto';
import { PublicBookingRescheduleDto } from './dto/public-booking-reschedule.dto';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get(':slug')
  getBusinessBySlug(@Param('slug') slug: string) {
    return this.publicService.getBusinessBySlug(slug);
  }

  @Get(':slug/bookings')
  getBookingsByClient(
    @Param('slug') slug: string,
    @Query('clientKey') clientKey: string,
  ) {
    return this.publicService.getBookingsByClientKey(slug, clientKey);
  }

  @Patch(':slug/bookings/:bookingId/cancel')
  cancelClientBooking(
    @Param('slug') slug: string,
    @Param('bookingId') bookingId: string,
    @Body() dto: PublicBookingCancelDto,
  ) {
    return this.publicService.cancelClientBooking(slug, bookingId, dto.clientKey);
  }

  @Patch(':slug/bookings/:bookingId/reschedule')
  rescheduleClientBooking(
    @Param('slug') slug: string,
    @Param('bookingId') bookingId: string,
    @Body() dto: PublicBookingRescheduleDto,
  ) {
    return this.publicService.rescheduleClientBooking(
      slug,
      bookingId,
      dto.clientKey,
      dto.date,
      dto.startTime,
    );
  }
}
