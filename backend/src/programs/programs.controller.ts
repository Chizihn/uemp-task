import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user.interface';
import { ProgramsService } from './programs.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';

@Controller('programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Get()
  findAll(@Query('departmentId') departmentId?: string) {
    return this.programsService.findAll(departmentId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.programsService.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.DEPT_ADMIN)
  create(@Body() dto: CreateProgramDto, @CurrentUser() actor: AuthUser) {
    return this.programsService.create(dto, actor);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.DEPT_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateProgramDto, @CurrentUser() actor: AuthUser) {
    return this.programsService.update(id, dto, actor);
  }
}
