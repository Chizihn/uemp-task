import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user.interface';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { RegistrationFilterDto } from './dto/registration-filter.dto';

@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Get('eligible-courses')
  @Roles(Role.STUDENT)
  getEligibleCourses(@CurrentUser() actor: AuthUser) {
    return this.registrationsService.findEligibleAllocations(actor.id);
  }

  @Get('me')
  @Roles(Role.STUDENT)
  getMyRegistrations(
    @CurrentUser() actor: AuthUser,
    @Query('sessionId') sessionId?: string,
    @Query('semesterId') semesterId?: string,
  ) {
    return this.registrationsService.findMyRegistrations(actor.id, { sessionId, semesterId });
  }

  @Post()
  @Roles(Role.STUDENT)
  register(@Body() dto: CreateRegistrationDto, @CurrentUser() actor: AuthUser) {
    return this.registrationsService.register(actor.id, dto.courseAllocationId);
  }

  @Delete(':id')
  @Roles(Role.STUDENT)
  withdraw(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.registrationsService.withdraw(actor.id, id);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.DEPT_ADMIN)
  findForDepartment(@CurrentUser() actor: AuthUser, @Query() filter: RegistrationFilterDto) {
    return this.registrationsService.findForDepartment(actor, filter);
  }
}
