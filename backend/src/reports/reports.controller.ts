import { Controller, Get, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user.interface';
import { ReportsService } from './reports.service';

function sendPdf(res: Response, { buffer, filename }: { buffer: Buffer; filename: string }) {
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length': buffer.length,
  });
  res.send(buffer);
}

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

  @Post('registration-summary/export')
  @Roles(Role.SUPER_ADMIN, Role.DEPT_ADMIN)
  async exportRegistrationSummary(
    @CurrentUser() actor: AuthUser,
    @Res() res: Response,
    @Query('sessionId') sessionId?: string,
    @Query('semesterId') semesterId?: string,
  ) {
    const report = await this.reportsService.exportRegistrationSummaryPdf(actor, {
      sessionId,
      semesterId,
    });
    sendPdf(res, report);
  }

  @Post('performance-summary/export')
  @Roles(Role.SUPER_ADMIN, Role.DEPT_ADMIN, Role.LECTURER)
  async exportPerformanceSummary(
    @CurrentUser() actor: AuthUser,
    @Res() res: Response,
    @Query('sessionId') sessionId?: string,
    @Query('semesterId') semesterId?: string,
  ) {
    const report = await this.reportsService.exportPerformanceSummaryPdf(actor, {
      sessionId,
      semesterId,
    });
    sendPdf(res, report);
  }
}
