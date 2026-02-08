import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('clients/:clientId/payments')
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  async create(
    @Param('clientId') clientId: string,
    @Body() dto: CreatePaymentDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.paymentsService.create(clientId, dto, userId, userRole);
  }

  @Get('clients/:clientId/payments')
  async findByClient(
    @Param('clientId') clientId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.paymentsService.findByClient(clientId, userId, userRole);
  }

  @Get('renewals')
  async getRenewals(
    @Query('month') month: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    // Validate month format
    if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw new ForbiddenException('Некорректный формат месяца (YYYY-MM)');
    }

    return this.paymentsService.getRenewals(month, userId, userRole);
  }
}
