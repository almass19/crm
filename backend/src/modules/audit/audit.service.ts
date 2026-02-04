import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(action: string, userId: string, clientId?: string, details?: string) {
    return this.prisma.auditLog.create({
      data: {
        action,
        userId,
        clientId,
        details,
      },
    });
  }

  async getByClient(clientId: string) {
    return this.prisma.auditLog.findMany({
      where: { clientId },
      include: { user: { select: { fullName: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
