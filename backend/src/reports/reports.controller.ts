import { Controller, Get, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user.interface';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('registration-summary')
  @Roles(Role.SUPER_ADMIN, Role.DEPT_ADMIN)
  registrationSummary(
    @CurrentUser() actor: AuthUser,
    @Query('sessionId') sessionId?: string,
    @Query('semesterId') semesterId?: string,
  ) {
    return this.reportsService.registrationSummary(actor, { sessionId, semesterId });
  }

  @Get('performance-summary')
  @Roles(Role.SUPER_ADMIN, Role.DEPT_ADMIN, Role.LECTURER)
  performanceSummary(
    @CurrentUser() actor: AuthUser,
    @Query('sessionId') sessionId?: string,
    @Query('semesterId') semesterId?: string,
  ) {
    return this.reportsService.performanceSummary(actor, { sessionId, semesterId });
  }
}
