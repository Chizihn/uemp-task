import { Module } from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { RegistrationsController } from './registrations.controller';
import { AcademicSessionsModule } from '../academic-sessions/academic-sessions.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AcademicSessionsModule, AuditLogModule],
  controllers: [RegistrationsController],
  providers: [RegistrationsService],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}
