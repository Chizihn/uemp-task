import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user.interface';
import { LecturersService } from './lecturers.service';
import { CreateLecturerDto } from './dto/create-lecturer.dto';
import { UpdateLecturerDto } from './dto/update-lecturer.dto';
import { LecturerFilterDto } from './dto/lecturer-filter.dto';

@Controller('lecturers')
@Roles(Role.SUPER_ADMIN, Role.DEPT_ADMIN)
export class LecturersController {
  constructor(private readonly lecturersService: LecturersService) {}

  @Get()
  findAll(@CurrentUser() actor: AuthUser, @Query() filter: LecturerFilterDto) {
    return this.lecturersService.findAll(actor, filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.lecturersService.findOne(id, actor);
  }

  @Post()
  create(@Body() dto: CreateLecturerDto, @CurrentUser() actor: AuthUser) {
    return this.lecturersService.create(dto, actor);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLecturerDto, @CurrentUser() actor: AuthUser) {
    return this.lecturersService.update(id, dto, actor);
  }
}
