import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getPersonalDashboard(
    userId: string,
    userRole: Role | null,
    year: number,
    month: number,
  ) {
    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    let whereClause: any;
    let dateField: string;

    switch (userRole) {
      case Role.SPECIALIST:
        // Clients assigned to specialist and acknowledged in the month
        whereClause = {
          assignedToId: userId,
          assignmentSeen: true,
          assignedAt: {
            gte: startDate,
            lte: endDate,
          },
        };
        dateField = 'assignedAt';
        break;

      case Role.DESIGNER:
        // Clients assigned to designer and acknowledged in the month
        whereClause = {
          designerId: userId,
          designerAssignmentSeen: true,
          designerAssignedAt: {
            gte: startDate,
            lte: endDate,
          },
        };
        dateField = 'designerAssignedAt';
        break;

      case Role.SALES_MANAGER:
        // Clients created by this sales manager in the month
        whereClause = {
          createdById: userId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        };
        dateField = 'createdAt';
        break;

      default:
        return { count: 0, clients: [], month, year, role: userRole };
    }

    const [count, clients] = await Promise.all([
      this.prisma.client.count({ where: whereClause }),
      this.prisma.client.findMany({
        where: whereClause,
        select: {
          id: true,
          fullName: true,
          companyName: true,
          phone: true,
          email: true,
          status: true,
          services: true,
          createdAt: true,
          assignedAt: true,
          designerAssignedAt: true,
        },
        orderBy: { [dateField]: 'desc' },
      }),
    ]);

    return {
      count,
      clients,
      month,
      year,
      role: userRole,
    };
  }

  async getUserDashboard(
    targetUserId: string,
    year: number,
    month: number,
  ) {
    // Get the target user's role
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, fullName: true, role: true },
    });

    if (!targetUser) {
      throw new NotFoundException('Пользователь не найден');
    }

    const dashboardData = await this.getPersonalDashboard(
      targetUserId,
      targetUser.role,
      year,
      month,
    );

    return {
      ...dashboardData,
      user: {
        id: targetUser.id,
        fullName: targetUser.fullName,
        role: targetUser.role,
      },
    };
  }
}
