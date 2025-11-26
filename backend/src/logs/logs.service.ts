import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LogsService {
  constructor(private prisma: PrismaService) {}

  async createActionLog(data: {
    businessId: string;
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    details?: any;
  }) {
    return this.prisma.actionLog.create({
      data,
    });
  }

  async createErrorLog(data: {
    businessId?: string;
    source: string;
    error: string;
    stack?: string;
  }) {
    return this.prisma.errorLog.create({
      data,
    });
  }

  async createSecurityLog(data: {
    ip: string;
    endpoint: string;
    details?: any;
  }) {
    return this.prisma.securityLog.create({
      data,
    });
  }

  async getActionLogs(businessId: string) {
    return this.prisma.actionLog.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    });
  }

  async getErrorLogs(businessId?: string) {
    return this.prisma.errorLog.findMany({
      where: businessId ? { businessId } : {},
      orderBy: { createdAt: 'desc' },
    });
  }
}
