import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { FacultiesService } from './faculties.service';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';

@Controller('faculties')
export class FacultiesController {
  constructor(private readonly facultiesService: FacultiesService) {}

  // No @Roles() here — any authenticated role can browse reference data.
  @Get()
  findAll() {
    return this.facultiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.facultiesService.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  create(@Body() dto: CreateFacultyDto) {
    return this.facultiesService.create(dto);
  }

  // No DELETE: structural entities are deactivated (isActive), never hard-deleted,
  // so historical records that reference them (via Department -> ... -> Result)
  // never dangle. See docs/02-database-schema.md "review notes".
  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateFacultyDto) {
    return this.facultiesService.update(id, dto);
  }
}
