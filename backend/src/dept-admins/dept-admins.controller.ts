import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { DeptAdminsService } from './dept-admins.service';
import { CreateDeptAdminDto } from './dto/create-dept-admin.dto';

@Controller('dept-admins')
@Roles(Role.SUPER_ADMIN)
export class DeptAdminsController {
  constructor(private readonly deptAdminsService: DeptAdminsService) {}

  @Get()
  findAll(@Query('departmentId') departmentId?: string) {
    return this.deptAdminsService.findAll(departmentId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deptAdminsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateDeptAdminDto) {
    return this.deptAdminsService.create(dto);
  }
}
