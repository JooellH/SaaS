import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  Delete,
} from '@nestjs/common';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { AuthGuard } from '@nestjs/passport';
import type { Request as ExpressRequest } from 'express';

type AuthedRequest = ExpressRequest & {
  user: { userId: string; email?: string };
};

@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(
    @Request() req: AuthedRequest,
    @Body() createBusinessDto: CreateBusinessDto,
  ) {
    return this.businessService.create(req.user.userId, createBusinessDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(@Request() req: AuthedRequest) {
    return this.businessService.findAll(req.user.userId, req.user.email);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('lost-memberships')
  findLostMemberships(@Request() req: AuthedRequest) {
    return this.businessService.findLostStaffMemberships(
      req.user.userId,
      req.user.email,
    );
  }

  @Get(':slug/public')
  findBySlug(@Param('slug') slug: string) {
    return this.businessService.findBySlug(slug);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Request() req: AuthedRequest, @Param('id') id: string) {
    await this.businessService.assertUserCanAccessBusiness(
      id,
      req.user.userId,
      req.user.email,
    );
    return this.businessService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(
    @Request() req: AuthedRequest,
    @Param('id') id: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
  ) {
    return this.businessService.update(id, req.user.userId, updateBusinessDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Request() req: AuthedRequest, @Param('id') id: string) {
    return this.businessService.remove(id, req.user.userId);
  }
}
