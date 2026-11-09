import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ReportExportService } from './report-export.service';

@Module({
  imports: [AuditLogModule],
  controllers: [ReportsController],
  providers: [ReportsService, ReportExportService],
})
export class ReportsModule {}
