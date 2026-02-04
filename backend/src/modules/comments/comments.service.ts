import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(clientId: string, authorId: string, content: string) {
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      throw new NotFoundException('Клиент не найден');
    }

    return this.prisma.comment.create({
      data: { content, clientId, authorId },
      include: { author: { select: { fullName: true, role: true } } },
    });
  }

  async findByClient(clientId: string) {
    return this.prisma.comment.findMany({
      where: { clientId },
      include: { author: { select: { fullName: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
