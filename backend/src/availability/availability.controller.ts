import { Controller, Get, Query, Param } from '@nestjs/common';
import { AvailabilityService } from './availability.service';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get(':businessId')
  async getAvailability(
    @Param('businessId') businessId: string,
    @Query('serviceId') serviceId: string,
    @Query('date') date: string,
  ) {
    return this.availabilityService.getAvailability(businessId, serviceId, date);
  }
}
