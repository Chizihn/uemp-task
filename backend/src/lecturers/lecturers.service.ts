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
import { hashPassword } from '../common/utils/password.util';
import { CreateLecturerDto } from './dto/create-lecturer.dto';
import { UpdateLecturerDto } from './dto/update-lecturer.dto';
import { LecturerFilterDto } from './dto/lecturer-filter.dto';

const DEFAULT_PAGE_SIZE = 50;

@Injectable()
export class LecturersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileLookup: ProfileLookupService,
  ) {}

  private async resolveDepartmentScope(actor: AuthUser, requestedDepartmentId?: string) {
    if (actor.role === Role.DEPT_ADMIN) {
      const ownDepartmentId = await this.profileLookup.getDeptAdminDepartmentId(actor.id);
      if (requestedDepartmentId && requestedDepartmentId !== ownDepartmentId) {
        throw new ForbiddenException('You can only manage lecturers within your own department');
      }
      return ownDepartmentId;
    }
    return requestedDepartmentId;
  }

  async findAll(actor: AuthUser, filter: LecturerFilterDto) {
    const departmentId = await this.resolveDepartmentScope(actor, filter.departmentId);

    const where: Prisma.LecturerWhereInput = {
      departmentId,
      user: filter.status ? { status: filter.status } : undefined,
      ...(filter.search
        ? {
            OR: [
              { staffId: { contains: filter.search, mode: 'insensitive' } },
              { title: { contains: filter.search, mode: 'insensitive' } },
              { user: { email: { contains: filter.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const skip = filter.skip ?? 0;
    const take = filter.take ?? DEFAULT_PAGE_SIZE;

    const [items, total] = await Promise.all([
      this.prisma.lecturer.findMany({
        where,
        include: { department: true, user: { select: { email: true, status: true } } },
        orderBy: { staffId: 'asc' },
        skip,
        take,
      }),
      this.prisma.lecturer.count({ where }),
    ]);

    return { items, total, skip, take };
  }

  async findOne(id: string, actor: AuthUser) {
    const lecturer = await this.prisma.lecturer.findUnique({
      where: { id },
      include: { department: true, user: { select: { email: true, status: true } } },
    });
    if (!lecturer) {
      throw new NotFoundException('Lecturer not found');
    }
    await this.resolveDepartmentScope(actor, lecturer.departmentId);
    return lecturer;
  }

  async create(dto: CreateLecturerDto, actor: AuthUser) {
    await this.resolveDepartmentScope(actor, dto.departmentId);
    const passwordHash = await hashPassword(dto.password);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { email: dto.email, passwordHash, role: Role.LECTURER },
        });
        return tx.lecturer.create({
          data: {
            userId: user.id,
            staffId: dto.staffId,
            title: dto.title,
            departmentId: dto.departmentId,
          },
          include: { department: true },
        });
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('A user with this email or staff ID already exists');
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateLecturerDto, actor: AuthUser) {
    await this.findOne(id, actor);
    try {
      return await this.prisma.lecturer.update({ where: { id }, data: dto });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('A lecturer with this staff ID already exists');
      }
      throw e;
    }
  }
}
