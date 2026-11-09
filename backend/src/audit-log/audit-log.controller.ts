import { Controller, Get, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { AuditLogService } from './audit-log.service';
import { AuditLogFilterDto } from './dto/audit-log-filter.dto';

@Controller('audit-log')
@Roles(Role.SUPER_ADMIN)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  list(@Query() filter: AuditLogFilterDto) {
    return this.auditLogService.list(filter);
  }
}
