import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user.interface';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseFilterDto } from './dto/course-filter.dto';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  findAll(@Query() filter: CourseFilterDto) {
    return this.coursesService.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.DEPT_ADMIN)
  create(@Body() dto: CreateCourseDto, @CurrentUser() actor: AuthUser) {
    return this.coursesService.create(dto, actor);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.DEPT_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto, @CurrentUser() actor: AuthUser) {
    return this.coursesService.update(id, dto, actor);
  }
}
