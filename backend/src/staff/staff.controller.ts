import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('business/:businessId/staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Param('businessId') businessId: string, @Body() createStaffDto: CreateStaffDto) {
    return this.staffService.create(businessId, createStaffDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(@Param('businessId') businessId: string) {
    return this.staffService.findAll(businessId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.staffService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStaffDto: UpdateStaffDto) {
    return this.staffService.update(id, updateStaffDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: string) {
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
