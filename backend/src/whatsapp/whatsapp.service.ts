import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import type { Prisma } from '@prisma/client';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly apiUrl = 'https://graph.facebook.com/v18.0';
  private readonly globalToken: string | null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Token global de WhatsApp (WHATSAPP_ACCESS_TOKEN desde Railway)
    this.globalToken =
      this.configService.get<string>('WHATSAPP_ACCESS_TOKEN') ||
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

    // Usar el número de WhatsApp del cliente, si existe
    const clientPhone = (booking.clientWhatsappPhone ||
      booking.clientPhone) as string;

    const message = `✅ *Reserva Confirmada*\n\nHola ${booking.clientName},\n\nTu reserva ha sido confirmada:\n\n📅 Fecha: ${booking.date.toLocaleDateString()}\n🕐 Hora: ${booking.startTime}\n💼 Servicio: ${booking.service.name}\n💰 Precio: $${booking.service.price}\n🏢 Negocio: ${booking.business.name}\n\n¡Te esperamos!`;

    return this.sendMessage(
      booking.business.whatsappPhoneNumberId as string | null,
      clientPhone,
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

    // Usar el número de WhatsApp del cliente, si existe
    const clientPhone = (booking.clientWhatsappPhone ||
      booking.clientPhone) as string;

    const message = `⏰ *Recordatorio de Reserva*\n\nHola ${booking.clientName},\n\nTe recordamos tu reserva:\n\n📅 Fecha: ${booking.date.toLocaleDateString()}\n🕐 Hora: ${booking.startTime}\n💼 Servicio: ${booking.service.name}\n🏢 Negocio: ${booking.business.name}\n\n¡Te esperamos pronto!`;

    return this.sendMessage(
      booking.business.whatsappPhoneNumberId as string | null,
      clientPhone,
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

    // Usar el número de WhatsApp del cliente, si existe
    const clientPhone = (booking.clientWhatsappPhone ||
      booking.clientPhone) as string;

    const message = `❌ *Reserva Cancelada*\n\nHola ${booking.clientName},\n\nTu reserva ha sido cancelada:\n\n📅 Fecha: ${booking.date.toLocaleDateString()}\n🕐 Hora: ${booking.startTime}\n💼 Servicio: ${booking.service.name}\n\nSi deseas reagendar, contáctanos.`;

    const cleanReason = reason?.trim();
    const messageWithReason = cleanReason
      ? `${message}\n\nMotivo: ${cleanReason}`
      : message;

    return this.sendMessage(
      booking.business.whatsappPhoneNumberId as string | null,
      clientPhone,
      messageWithReason,
      bookingId,
      'cancellation',
    );
  }

  private async sendMessage(
    phoneNumberId: string | null,
    to: string,
    message: string,
    bookingId: string,
    type: string,
  ) {
    if (!phoneNumberId || !this.globalToken) {
      this.logger.warn(
        'WhatsApp not configured: missing phoneNumberId or token',
      );
      return this.logMessage(bookingId, type, 'skipped', {
        reason: 'No phoneNumberId or token configured',
      });
    }

    try {
      const response = await axios.post<unknown>(
        `${this.apiUrl}/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: to.replace(/\D/g, ''),
          type: 'text',
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${this.globalToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const data = response.data as Prisma.JsonValue;

      await this.logMessage(
        bookingId,
        type,
        'sent',
        data as Prisma.InputJsonValue,
      );
      return { success: true, data };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send WhatsApp message: ${message}`);
      await this.logMessage(bookingId, type, 'failed', {
        error: message,
      } as Prisma.InputJsonValue);
      return { success: false, error: message };
    }
  }

  private async logMessage(
    bookingId: string,
    type: string,
    status: string,
    rawResponse: Prisma.InputJsonValue | undefined,
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
