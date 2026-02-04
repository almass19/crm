import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ClientStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateClientDto, userId: string) {
    if (!dto.fullName && !dto.companyName) {
      throw new BadRequestException(
        'Необходимо указать ФИО или название компании',
      );
    }

    const client = await this.prisma.client.create({
      data: {
        fullName: dto.fullName,
        companyName: dto.companyName,
        phone: dto.phone,
        email: dto.email,
        source: dto.source,
        notes: dto.notes,
        createdById: userId,
      },
      include: {
        createdBy: { select: { fullName: true } },
        assignedTo: { select: { fullName: true } },
      },
    });

    await this.auditService.log(
      'CLIENT_CREATED',
      userId,
      client.id,
      `Клиент создан: ${dto.fullName || dto.companyName}`,
    );

    return client;
  }

  async findAll(
    userRole: Role,
    userId: string,
    search?: string,
    status?: ClientStatus,
    unassigned?: boolean,
  ) {
    const where: any = { archived: false };

    if (userRole === Role.SPECIALIST) {
      where.assignedToId = userId;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (unassigned) {
      where.assignedToId = null;
    }

    return this.prisma.client.findMany({
      where,
      include: {
        createdBy: { select: { fullName: true } },
        assignedTo: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, userRole: Role, userId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, fullName: true, role: true } },
        assignedTo: { select: { id: true, fullName: true, role: true } },
        assignmentHistory: {
          include: {
            specialist: { select: { fullName: true } },
            assignedBy: { select: { fullName: true } },
          },
          orderBy: { assignedAt: 'desc' },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Клиент не найден');
    }

    if (userRole === Role.SPECIALIST && client.assignedToId !== userId) {
      throw new ForbiddenException('Нет доступа к данному клиенту');
    }

    return client;
  }

  async update(
    id: string,
    dto: UpdateClientDto,
    userId: string,
    userRole: Role,
  ) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) {
      throw new NotFoundException('Клиент не найден');
    }

    if (userRole === Role.SPECIALIST && client.assignedToId !== userId) {
      throw new ForbiddenException('Нет доступа к данному клиенту');
    }

    if (dto.status && userRole !== Role.PROJECT_MANAGER) {
      throw new ForbiddenException(
        'Только проект-менеджер может менять статус клиента',
      );
    }

    const updated = await this.prisma.client.update({
      where: { id },
      data: dto,
      include: {
        createdBy: { select: { fullName: true } },
        assignedTo: { select: { fullName: true } },
      },
    });

    if (dto.status) {
      await this.auditService.log(
        'STATUS_CHANGED',
        userId,
        id,
        `Статус изменён: ${client.status} → ${dto.status}`,
      );
    }

    return updated;
  }

  async archive(id: string, userId: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) {
      throw new NotFoundException('Клиент не найден');
    }

    await this.auditService.log(
      'CLIENT_ARCHIVED',
      userId,
      id,
      'Клиент архивирован',
    );

    return this.prisma.client.update({
      where: { id },
      data: { archived: true },
    });
  }

  async assign(clientId: string, specialistId: string, assignedById: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });
    if (!client) {
      throw new NotFoundException('Клиент не найден');
    }

    const specialist = await this.prisma.user.findUnique({
      where: { id: specialistId },
    });
    if (!specialist || specialist.role !== Role.SPECIALIST) {
      throw new BadRequestException('Указанный пользователь не является специалистом');
    }

    const oldAssignee = client.assignedToId;

    const updated = await this.prisma.client.update({
      where: { id: clientId },
      data: {
        assignedToId: specialistId,
        assignedAt: new Date(),
        status: ClientStatus.ASSIGNED,
        assignmentSeen: false,
      },
      include: {
        createdBy: { select: { fullName: true } },
        assignedTo: { select: { fullName: true } },
      },
    });

    await this.prisma.assignmentHistory.create({
      data: {
        clientId,
        specialistId,
        assignedById,
      },
    });

    const action = oldAssignee ? 'SPECIALIST_REASSIGNED' : 'SPECIALIST_ASSIGNED';
    await this.auditService.log(
      action,
      assignedById,
      clientId,
      `Специалист назначен: ${specialist.fullName}`,
    );

    return updated;
  }

  async acknowledge(clientId: string, userId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });
    if (!client) {
      throw new NotFoundException('Клиент не найден');
    }
    if (client.assignedToId !== userId) {
      throw new ForbiddenException('Вы не назначены на данного клиента');
    }
    if (client.assignmentSeen) {
      throw new BadRequestException('Назначение уже подтверждено');
    }

    const updated = await this.prisma.client.update({
      where: { id: clientId },
      data: {
        assignmentSeen: true,
        status: ClientStatus.IN_WORK,
      },
    });

    await this.auditService.log(
      'ASSIGNMENT_ACKNOWLEDGED',
      userId,
      clientId,
      'Специалист принял клиента в работу',
    );

    return updated;
  }
}
