import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ExportService } from './export.service';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { BillingService } from '../billing/billing.service';
import { BusinessService } from '../business/business.service';
import type { Request as ExpressRequest } from 'express';

type AuthedRequest = ExpressRequest & {
  user: { userId: string; email?: string };
};

@Controller('export')
export class ExportController {
  constructor(
    private readonly exportService: ExportService,
    private readonly billingService: BillingService,
    private readonly businessService: BusinessService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('reservations/:businessId')
  async exportReservations(
    @Request() req: AuthedRequest,
    @Param('businessId') businessId: string,
    @Res() res: Response,
  ) {
    await this.businessService.assertUserCanAccessBusiness(
      businessId,
      req.user.userId,
      req.user.email,
    );
    await this.billingService.requirePro(
      businessId,
      'Exportación CSV está disponible solo en el plan Pro.',
    );
    return this.exportService.exportReservations(businessId, res);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('clients/:businessId')
  async exportClients(
    @Request() req: AuthedRequest,
    @Param('businessId') businessId: string,
    @Res() res: Response,
  ) {
    await this.businessService.assertUserCanAccessBusiness(
      businessId,
      req.user.userId,
      req.user.email,
    );
    await this.billingService.requirePro(
      businessId,
      'Exportación CSV está disponible solo en el plan Pro.',
    );
    return this.exportService.exportClients(businessId, res);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('services/:businessId')
  async exportServices(
    @Request() req: AuthedRequest,
    @Param('businessId') businessId: string,
    @Res() res: Response,
  ) {
    await this.businessService.assertUserCanAccessBusiness(
      businessId,
      req.user.userId,
      req.user.email,
    );
    await this.billingService.requirePro(
      businessId,
      'Exportación CSV está disponible solo en el plan Pro.',
    );
    return this.exportService.exportServices(businessId, res);
  }
}
