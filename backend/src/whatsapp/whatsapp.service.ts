import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly apiUrl = 'https://graph.facebook.com/v18.0';
  private readonly globalToken: string | null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.globalToken =
      this.configService.get<string>('WHATSAPP_CLOUD_API_TOKEN') ||
      this.configService.get<string>('WHATSAPP_TOKEN') ||
      null;
  }

  async sendConfirmation(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: true,
        business: true,
      },
    });

    if (!booking) throw new Error('Booking not found');

    const message = `✅ *Reserva Confirmada*\n\nHola ${booking.clientName},\n\nTu reserva ha sido confirmada:\n\n📅 Fecha: ${booking.date.toLocaleDateString()}\n🕐 Hora: ${booking.startTime}\n💼 Servicio: ${booking.service.name}\n🏢 Negocio: ${booking.business.name}\n\n¡Te esperamos!`;

    return this.sendMessage(
      booking.business.whatsappToken,
      booking.business.phoneNumber,
      booking.clientPhone,
      message,
      bookingId,
      'confirmation',
    );
  }

  async sendReminder(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: true,
        business: true,
      },
    });

    if (!booking) throw new Error('Booking not found');

    const message = `⏰ *Recordatorio de Reserva*\n\nHola ${booking.clientName},\n\nTe recordamos tu reserva:\n\n📅 Fecha: ${booking.date.toLocaleDateString()}\n🕐 Hora: ${booking.startTime}\n💼 Servicio: ${booking.service.name}\n🏢 Negocio: ${booking.business.name}\n\n¡Te esperamos pronto!`;

    return this.sendMessage(
      booking.business.whatsappToken,
      booking.business.phoneNumber,
      booking.clientPhone,
      message,
      bookingId,
      'reminder',
    );
  }

  async sendCancellation(bookingId: string, reason?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: true,
        business: true,
      },
    });

    if (!booking) throw new Error('Booking not found');

    const message = `❌ *Reserva Cancelada*\n\nHola ${booking.clientName},\n\nTu reserva ha sido cancelada:\n\n📅 Fecha: ${booking.date.toLocaleDateString()}\n🕐 Hora: ${booking.startTime}\n💼 Servicio: ${booking.service.name}\n\nSi deseas reagendar, contáctanos.`;

    const cleanReason = reason?.trim();
    const messageWithReason = cleanReason
      ? `${message}\n\nMotivo: ${cleanReason}`
      : message;

    return this.sendMessage(
      booking.business.whatsappToken,
      booking.business.phoneNumber,
      booking.clientPhone,
      messageWithReason,
      bookingId,
      'cancellation',
    );
  }

  private async sendMessage(
    token: string | null,
    phoneNumberId: string | null,
    to: string,
    message: string,
    bookingId: string,
    type: string,
  ) {
    const resolvedToken = token || this.globalToken;
    if (!resolvedToken || !phoneNumberId) {
      this.logger.warn('WhatsApp credentials not configured');
      return this.logMessage(bookingId, type, 'skipped', {
        reason: 'No credentials',
      });
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: to.replace(/\D/g, ''),
          type: 'text',
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${resolvedToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      await this.logMessage(bookingId, type, 'sent', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp message: ${error.message}`);
      await this.logMessage(bookingId, type, 'failed', {
        error: error.message,
      });
      return { success: false, error: error.message };
    }
  }

  private async logMessage(
    bookingId: string,
    type: string,
    status: string,
    rawResponse: any,
  ) {
    return this.prisma.messageLog.create({
      data: {
        bookingId,
        type,
        status,
        rawResponse,
      },
    });
  }

  async getMessageLogs(bookingId: string) {
    return this.prisma.messageLog.findMany({
      where: { bookingId },
      orderBy: { id: 'desc' },
    });
  }
}
