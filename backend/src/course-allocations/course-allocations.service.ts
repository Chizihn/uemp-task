import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ResultStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileLookupService } from '../common/profile-lookup.service';
import { AuthUser } from '../common/types/auth-user.interface';
import { CreateAllocationDto } from './dto/create-allocation.dto';
import { UpdateAllocationDto } from './dto/update-allocation.dto';
import { AllocationFilterDto } from './dto/allocation-filter.dto';

const include = {
  course: true,
  lecturer: { include: { department: true } },
  session: true,
  semester: true,
} satisfies Prisma.CourseAllocationInclude;

const DEFAULT_PAGE_SIZE = 50;

@Injectable()
export class CourseAllocationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileLookup: ProfileLookupService,
  ) {}

  async findAll(actor: AuthUser, filter: AllocationFilterDto) {
    const courseWhere: Prisma.CourseWhereInput = {
      ...(filter.search
        ? {
            OR: [
              { code: { contains: filter.search, mode: 'insensitive' } },
              { title: { contains: filter.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const where: Prisma.CourseAllocationWhereInput = {
      sessionId: filter.sessionId,
      semesterId: filter.semesterId,
      courseId: filter.courseId,
      lecturerId: filter.lecturerId,
      course: Object.keys(courseWhere).length > 0 ? courseWhere : undefined,
    };

    if (actor.role === Role.DEPT_ADMIN) {
      const departmentId = await this.profileLookup.getDeptAdminDepartmentId(actor.id);
      where.course = { ...courseWhere, departmentId };
    } else if (actor.role === Role.LECTURER) {
      const lecturer = await this.profileLookup.getLecturerProfile(actor.id);
      where.lecturerId = lecturer.id; // a lecturer only ever sees their own, regardless of query params
    }

    const skip = filter.skip ?? 0;
    const take = filter.take ?? DEFAULT_PAGE_SIZE;

    const [items, total] = await Promise.all([
      this.prisma.courseAllocation.findMany({ where, include, skip, take }),
      this.prisma.courseAllocation.count({ where }),
    ]);

    return { items, total, skip, take };
  }

  async findOne(id: string, actor: AuthUser) {
    const allocation = await this.prisma.courseAllocation.findUnique({ where: { id }, include });
    if (!allocation) {
      throw new NotFoundException('Course allocation not found');
    }
    await this.assertCanManage(actor, allocation.course.departmentId, allocation.lecturerId);
    return allocation;
  }

  /** Dept Admins may only allocate within their own department, using their own department's lecturers. */
  private async assertCanManage(actor: AuthUser, courseDepartmentId: string, lecturerId?: string) {
    if (actor.role !== Role.DEPT_ADMIN) {
      return; // Super Admin / read access by Lecturer already scoped in findAll
    }
    const ownDepartmentId = await this.profileLookup.getDeptAdminDepartmentId(actor.id);
    if (courseDepartmentId !== ownDepartmentId) {
      throw new ForbiddenException(
        "You can only manage allocations for your own department's courses",
      );
    }
    if (lecturerId) {
      const lecturer = await this.prisma.lecturer.findUnique({ where: { id: lecturerId } });
      if (!lecturer || lecturer.departmentId !== ownDepartmentId) {
        throw new ForbiddenException('You can only assign lecturers from your own department');
      }
    }
  }

  async create(dto: CreateAllocationDto, actor: AuthUser) {
    const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    await this.assertCanManage(actor, course.departmentId, dto.lecturerId);

    try {
      return await this.prisma.courseAllocation.create({ data: dto, include });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException(
          'This course already has a lecturer assigned for that session/semester',
        );
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateAllocationDto, actor: AuthUser) {
    const allocation = await this.findOne(id, actor);

    const hasLockedResults = await this.prisma.result.count({
      where: {
        registration: { courseAllocationId: id },
        status: { not: ResultStatus.DRAFT },
      },
    });
    if (hasLockedResults > 0) {
      throw new ConflictException(
        'This allocation has results already submitted for review — reassigning the lecturer is no longer allowed',
      );
    }

    await this.assertCanManage(actor, allocation.course.departmentId, dto.lecturerId);
    return this.prisma.courseAllocation.update({ where: { id }, data: dto, include });
  }
}
