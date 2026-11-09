import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user.interface';
import { CourseAllocationsService } from './course-allocations.service';
import { CreateAllocationDto } from './dto/create-allocation.dto';
import { UpdateAllocationDto } from './dto/update-allocation.dto';
import { AllocationFilterDto } from './dto/allocation-filter.dto';

@Controller('course-allocations')
export class CourseAllocationsController {
  constructor(private readonly allocationsService: CourseAllocationsService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.DEPT_ADMIN, Role.LECTURER)
  findAll(@CurrentUser() actor: AuthUser, @Query() filter: AllocationFilterDto) {
    return this.allocationsService.findAll(actor, filter);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.DEPT_ADMIN, Role.LECTURER)
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.allocationsService.findOne(id, actor);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.DEPT_ADMIN)
  create(@Body() dto: CreateAllocationDto, @CurrentUser() actor: AuthUser) {
    return this.allocationsService.create(dto, actor);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.DEPT_ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAllocationDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.allocationsService.update(id, dto, actor);
  }
}
