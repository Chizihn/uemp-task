import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user.interface';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentFilterDto } from './dto/student-filter.dto';

@Controller('students')
@Roles(Role.SUPER_ADMIN, Role.DEPT_ADMIN)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  findAll(@CurrentUser() actor: AuthUser, @Query() filter: StudentFilterDto) {
    return this.studentsService.findAll(actor, filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.studentsService.findOne(id, actor);
  }

  @Post()
  create(@Body() dto: CreateStudentDto, @CurrentUser() actor: AuthUser) {
    return this.studentsService.create(dto, actor);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStudentDto, @CurrentUser() actor: AuthUser) {
    return this.studentsService.update(id, dto, actor);
  }
}
