import {
  BadRequestException,
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
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentFilterDto } from './dto/student-filter.dto';

const DEFAULT_PAGE_SIZE = 50;

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileLookup: ProfileLookupService,
  ) {}

  /** Dept Admins only ever see/manage students in their own department; Super Admin sees all. */
  private async resolveDepartmentScope(actor: AuthUser, requestedDepartmentId?: string) {
    if (actor.role === Role.DEPT_ADMIN) {
      const ownDepartmentId = await this.profileLookup.getDeptAdminDepartmentId(actor.id);
      if (requestedDepartmentId && requestedDepartmentId !== ownDepartmentId) {
        throw new ForbiddenException('You can only manage students within your own department');
      }
      return ownDepartmentId;
    }
    return requestedDepartmentId; // undefined => Super Admin, unscoped
  }

  async findAll(actor: AuthUser, filter: StudentFilterDto) {
    const departmentId = await this.resolveDepartmentScope(actor, filter.departmentId);

    const where: Prisma.StudentWhereInput = {
      departmentId,
      programId: filter.programId,
      level: filter.level,
      user: filter.status ? { status: filter.status } : undefined,
      ...(filter.search
        ? {
            OR: [
              { matricNumber: { contains: filter.search, mode: 'insensitive' } },
              { user: { email: { contains: filter.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const skip = filter.skip ?? 0;
    const take = filter.take ?? DEFAULT_PAGE_SIZE;

    const [items, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        include: {
          department: true,
          program: true,
          user: { select: { email: true, status: true } },
        },
        orderBy: { matricNumber: 'asc' },
        skip,
        take,
      }),
      this.prisma.student.count({ where }),
    ]);

    return { items, total, skip, take };
  }

  async findOne(id: string, actor: AuthUser) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { department: true, program: true, user: { select: { email: true, status: true } } },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    await this.resolveDepartmentScope(actor, student.departmentId);
    return student;
  }

  async create(dto: CreateStudentDto, actor: AuthUser) {
    await this.resolveDepartmentScope(actor, dto.departmentId);

    const program = await this.prisma.program.findUnique({ where: { id: dto.programId } });
    if (!program || program.departmentId !== dto.departmentId) {
      throw new BadRequestException('The selected program does not belong to this department');
    }

    const passwordHash = await hashPassword(dto.password);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { email: dto.email, passwordHash, role: Role.STUDENT },
        });
        return tx.student.create({
          data: {
            userId: user.id,
            matricNumber: dto.matricNumber,
            departmentId: dto.departmentId,
            programId: dto.programId,
            level: dto.level,
          },
          include: { department: true, program: true },
        });
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('A user with this email or matric number already exists');
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateStudentDto, actor: AuthUser) {
    const student = await this.findOne(id, actor);

    if (dto.programId) {
      const program = await this.prisma.program.findUnique({ where: { id: dto.programId } });
      if (!program || program.departmentId !== student.departmentId) {
        throw new BadRequestException('The selected program does not belong to this department');
      }
    }

    try {
      return await this.prisma.student.update({ where: { id }, data: dto });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('A student with this matric number already exists');
      }
      throw e;
    }
  }
}
