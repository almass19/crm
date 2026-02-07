import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('my')
  @Roles(Role.SPECIALIST, Role.DESIGNER, Role.SALES_MANAGER)
  async getMyDashboard(
    @CurrentUser() user: { id: string; role: Role },
    @Query() query: DashboardQueryDto,
  ) {
    return this.dashboardService.getPersonalDashboard(
      user.id,
      user.role,
      query.year,
      query.month,
    );
  }

  @Get('user/:userId')
  @Roles(Role.ADMIN)
  async getUserDashboard(
    @Param('userId') userId: string,
    @Query() query: DashboardQueryDto,
  ) {
    return this.dashboardService.getUserDashboard(
      userId,
      query.year,
      query.month,
    );
  }
}
