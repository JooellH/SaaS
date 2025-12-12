import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Response } from 'express';

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  private jsonToCsv(data: any[], fields: string[]) {
    if (!data || data.length === 0) return '';
    const header = fields.join(',') + '\n';
    const rows = data
      .map((row) =>
        fields
          .map((field) => {
            const val = row[field] || '';
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(','),
      )
      .join('\n');
    return header + rows;
  }

  async exportReservations(businessId: string, res: Response) {
    const data = await this.prisma.booking.findMany({
      where: { businessId },
      include: { service: true },
    });

    const flattened = data.map((b) => ({
      id: b.id,
      date: b.date.toISOString(),
      startTime: b.startTime,
      endTime: b.endTime,
      clientName: b.clientName,
      clientPhone: b.clientPhone,
      serviceName: b.service.name,
      status: b.status,
    }));

    const csv = this.jsonToCsv(flattened, [
      'id',
      'date',
      'startTime',
      'endTime',
      'clientName',
      'clientPhone',
      'serviceName',
      'status',
    ]);

    res.header('Content-Type', 'text/csv');
    res.header(
      'Content-Disposition',
      'attachment; filename="reservations.csv"',
    );
    res.send(csv);
  }

  async exportClients(businessId: string, res: Response) {
    // Clients are derived from Bookings in this schema (no separate Client table yet, though implied by "Export Clients")
    // I'll aggregate unique clients from bookings
    const bookings = await this.prisma.booking.findMany({
      where: { businessId },
      select: { clientName: true, clientPhone: true, clientEmail: true },
      distinct: ['clientPhone'], // distinct by phone
    });

    const csv = this.jsonToCsv(bookings, [
      'clientName',
      'clientPhone',
      'clientEmail',
    ]);

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename="clients.csv"');
    res.send(csv);
  }

  async exportServices(businessId: string, res: Response) {
    const data = await this.prisma.service.findMany({
      where: { businessId },
    });

    const csv = this.jsonToCsv(data, [
      'id',
      'name',
      'durationMinutes',
      'price',
      'isActive',
    ]);

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename="services.csv"');
    res.send(csv);
  }
}
