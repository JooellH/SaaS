import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ExportService } from './export.service';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('reservations/:businessId')
  exportReservations(@Param('businessId') businessId: string, @Res() res: Response) {
    return this.exportService.exportReservations(businessId, res);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('clients/:businessId')
  exportClients(@Param('businessId') businessId: string, @Res() res: Response) {
    return this.exportService.exportClients(businessId, res);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('services/:businessId')
  exportServices(@Param('businessId') businessId: string, @Res() res: Response) {
    return this.exportService.exportServices(businessId, res);
  }
}
