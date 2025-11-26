import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('business/:businessId/schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Param('businessId') businessId: string, @Body() createScheduleDto: CreateScheduleDto) {
    return this.scheduleService.create(businessId, createScheduleDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(@Param('businessId') businessId: string) {
    return this.scheduleService.findAll(businessId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.scheduleService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateScheduleDto: UpdateScheduleDto) {
    return this.scheduleService.update(id, updateScheduleDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.scheduleService.remove(id);
  }

  // Special Days
  @UseGuards(AuthGuard('jwt'))
  @Post('special-days')
  addSpecialDay(
    @Param('businessId') businessId: string,
    @Body() body: { date: string; isClosed: boolean; intervals?: any; reason?: string },
  ) {
    return this.scheduleService.addSpecialDay(businessId, new Date(body.date), body.isClosed, body.intervals, body.reason);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('special-days')
  getSpecialDays(@Param('businessId') businessId: string) {
    return this.scheduleService.getSpecialDays(businessId);
  }
}
