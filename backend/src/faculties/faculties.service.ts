import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';

@Injectable()
export class FacultiesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.faculty.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const faculty = await this.prisma.faculty.findUnique({ where: { id } });
    if (!faculty) {
      throw new NotFoundException('Faculty not found');
    }
    return faculty;
  }

  async create(dto: CreateFacultyDto) {
    try {
      return await this.prisma.faculty.create({ data: dto });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('A faculty with this code already exists');
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateFacultyDto) {
    await this.findOne(id);
    try {
      return await this.prisma.faculty.update({ where: { id }, data: dto });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('A faculty with this code already exists');
      }
      throw e;
    }
  }
}
