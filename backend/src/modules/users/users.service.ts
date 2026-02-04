import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByRole(role: Role) {
    return this.prisma.user.findMany({
      where: { role },
      select: { id: true, email: true, fullName: true, role: true },
    });
  }
}
