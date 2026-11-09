import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { AcademicSessionsService } from './academic-sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { CreateSemesterDto } from './dto/create-semester.dto';

@Controller('academic-sessions')
export class AcademicSessionsController {
  constructor(private readonly sessionsService: AcademicSessionsService) {}

  @Get()
  findAll() {
    return this.sessionsService.findAll();
  }

  @Get('active')
  getActive() {
    return this.sessionsService.getActivePeriod();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  create(@Body() dto: CreateSessionDto) {
    return this.sessionsService.create(dto);
  }

  @Patch(':id/activate')
  @Roles(Role.SUPER_ADMIN)
  activateSession(@Param('id') id: string) {
    return this.sessionsService.activateSession(id);
  }

  @Post(':id/semesters')
  @Roles(Role.SUPER_ADMIN)
  addSemester(@Param('id') id: string, @Body() dto: CreateSemesterDto) {
    return this.sessionsService.addSemester(id, dto);
  }

  @Patch('semesters/:semesterId/activate')
  @Roles(Role.SUPER_ADMIN)
  activateSemester(@Param('semesterId') semesterId: string) {
    return this.sessionsService.activateSemester(semesterId);
  }
}
