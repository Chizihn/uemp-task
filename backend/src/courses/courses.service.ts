import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileLookupService } from '../common/profile-lookup.service';
import { AuthUser } from '../common/types/auth-user.interface';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseFilterDto } from './dto/course-filter.dto';

const DEFAULT_PAGE_SIZE = 50;

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileLookup: ProfileLookupService,
  ) {}

  async findAll(filter: CourseFilterDto) {
    const where: Prisma.CourseWhereInput = {
      departmentId: filter.departmentId,
      level: filter.level,
      term: filter.term,
      ...(filter.search
        ? {
            OR: [
              { code: { contains: filter.search, mode: 'insensitive' } },
              { title: { contains: filter.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const skip = filter.skip ?? 0;
    const take = filter.take ?? DEFAULT_PAGE_SIZE;

    const [items, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        include: { department: true },
        orderBy: { code: 'asc' },
        skip,
        take,
      }),
      this.prisma.course.count({ where }),
    ]);

    return { items, total, skip, take };
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { department: true },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  /** Dept Admins may only create courses inside their own department; Super Admin is unrestricted. */
  private async assertDepartmentScope(actor: AuthUser, departmentId: string) {
    if (actor.role === Role.DEPT_ADMIN) {
      const ownDepartmentId = await this.profileLookup.getDeptAdminDepartmentId(actor.id);
      if (ownDepartmentId !== departmentId) {
        throw new ForbiddenException('You can only manage courses within your own department');
      }
    }
  }

  async create(dto: CreateCourseDto, actor: AuthUser) {
    await this.assertDepartmentScope(actor, dto.departmentId);
    try {
      return await this.prisma.course.create({ data: dto });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('A course with this code already exists');
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateCourseDto, actor: AuthUser) {
    const course = await this.findOne(id);
    await this.assertDepartmentScope(actor, course.departmentId);
    try {
      return await this.prisma.course.update({ where: { id }, data: dto });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('A course with this code already exists');
      }
      throw e;
    }
  }
}
