import { Controller, Post, Param, Get, UseGuards } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('send-confirmation/:bookingId')
  sendConfirmation(@Param('bookingId') bookingId: string) {
    return this.whatsappService.sendConfirmation(bookingId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('send-reminder/:bookingId')
  sendReminder(@Param('bookingId') bookingId: string) {
    return this.whatsappService.sendReminder(bookingId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('send-cancellation/:bookingId')
  sendCancellation(@Param('bookingId') bookingId: string) {
    return this.whatsappService.sendCancellation(bookingId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('logs/:bookingId')
  getMessageLogs(@Param('bookingId') bookingId: string) {
    return this.whatsappService.getMessageLogs(bookingId);
  }
}
