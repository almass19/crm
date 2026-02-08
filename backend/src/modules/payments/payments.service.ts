import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(
    clientId: string,
    dto: CreatePaymentDto,
    managerId: string,
    userRole: Role,
  ) {
    // Only Admin and Sales Manager can create payments
    if (userRole !== Role.ADMIN && userRole !== Role.SALES_MANAGER) {
      throw new ForbiddenException('Недостаточно прав для создания платежа');
    }

    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });
    if (!client) {
      throw new NotFoundException('Клиент не найден');
    }

    return this.prisma.payment.create({
      data: {
        amount: dto.amount,
        month: dto.month,
        isRenewal: dto.isRenewal,
        clientId,
        managerId,
      },
      include: {
        client: { select: { id: true, fullName: true, companyName: true } },
        manager: { select: { id: true, fullName: true } },
      },
    });
  }

  async findByClient(clientId: string, userId: string, userRole: Role) {
    // Specialist and Designer cannot see payments
    if (userRole === Role.SPECIALIST || userRole === Role.DESIGNER) {
      throw new ForbiddenException('Недостаточно прав для просмотра платежей');
    }

    const whereClause: { clientId: string; managerId?: string } = { clientId };

    // Sales Manager can only see their own payments
    if (userRole === Role.SALES_MANAGER) {
      whereClause.managerId = userId;
    }

    return this.prisma.payment.findMany({
      where: whereClause,
      include: {
        manager: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRenewals(month: string, userId: string, userRole: Role) {
    // Only Admin and Specialist can access renewals
    if (userRole !== Role.ADMIN && userRole !== Role.SPECIALIST) {
      throw new ForbiddenException('Недостаточно прав для просмотра продлений');
    }

    let whereClause: {
      isRenewal: boolean;
      month: string;
      client?: { assignedToId: string };
    } = {
      isRenewal: true,
      month,
    };

    // Specialist can only see renewals of their assigned clients
    if (userRole === Role.SPECIALIST) {
      whereClause = {
        ...whereClause,
        client: { assignedToId: userId },
      };
    }

    const payments = await this.prisma.payment.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            companyName: true,
            assignedTo: { select: { id: true, fullName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      month,
      totalRenewals: payments.length,
      clients: payments.map((p) => ({
        clientId: p.client.id,
        clientName: p.client.fullName || p.client.companyName,
        amount: p.amount,
        renewedAt: p.createdAt.toISOString().split('T')[0],
        specialist: p.client.assignedTo,
      })),
    };
  }
}
