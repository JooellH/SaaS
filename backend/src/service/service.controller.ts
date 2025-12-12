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
} from '@nestjs/common';
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { AuthGuard } from '@nestjs/passport';
import { BusinessService } from '../business/business.service';
import type { Request as ExpressRequest } from 'express';

type AuthedRequest = ExpressRequest & { user: { userId: string; email?: string } };

@Controller('services')
export class ServiceController {
  constructor(
    private readonly serviceService: ServiceService,
    private readonly businessService: BusinessService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(
    @Request() req: AuthedRequest,
    @Body() createServiceDto: CreateServiceDto,
  ) {
    await this.businessService.assertUserCanAccessBusiness(
      createServiceDto.businessId,
      req.user.userId,
      req.user.email,
    );
    return this.serviceService.create(createServiceDto);
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
    return this.serviceService.findAll(businessId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async update(
    @Request() req: AuthedRequest,
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    const service = await this.serviceService.findOne(id);
    await this.businessService.assertUserCanAccessBusiness(
      service.businessId,
      req.user.userId,
      req.user.email,
    );
    return this.serviceService.update(id, updateServiceDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Request() req: AuthedRequest, @Param('id') id: string) {
    const service = await this.serviceService.findOne(id);
    await this.businessService.assertUserCanAccessBusiness(
      service.businessId,
      req.user.userId,
      req.user.email,
    );
    return this.serviceService.remove(id);
  }
}
