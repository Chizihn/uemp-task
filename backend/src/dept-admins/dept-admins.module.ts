import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { DeptAdminsService } from './dept-admins.service';
import { DeptAdminsController } from './dept-admins.controller';

@Module({
  imports: [AuditLogModule],
  controllers: [DeptAdminsController],
  providers: [DeptAdminsService],
  exports: [DeptAdminsService],
})
export class DeptAdminsModule {}
