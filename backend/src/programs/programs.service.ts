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
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';

@Injectable()
export class ProgramsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileLookup: ProfileLookupService,
  ) {}

  /** Dept Admins may only manage programs inside their own department; Super Admin is unrestricted. */
  private async assertDepartmentScope(actor: AuthUser, departmentId: string) {
    if (actor.role === Role.DEPT_ADMIN) {
      const ownDepartmentId = await this.profileLookup.getDeptAdminDepartmentId(actor.id);
      if (ownDepartmentId !== departmentId) {
        throw new ForbiddenException('You can only manage programs within your own department');
      }
    }
  }

  findAll(departmentId?: string) {
    return this.prisma.program.findMany({
      where: departmentId ? { departmentId } : undefined,
      include: { department: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const program = await this.prisma.program.findUnique({
      where: { id },
      include: { department: true },
    });
    if (!program) {
      throw new NotFoundException('Program not found');
    }
    return program;
  }

  async create(dto: CreateProgramDto, actor: AuthUser) {
    await this.assertDepartmentScope(actor, dto.departmentId);
    try {
      return await this.prisma.program.create({ data: dto });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('A program with this code already exists');
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateProgramDto, actor: AuthUser) {
    const program = await this.findOne(id);
    await this.assertDepartmentScope(actor, program.departmentId);
    if (dto.departmentId) {
      // Also blocks a Dept Admin from reassigning the program to a department they don't manage.
      await this.assertDepartmentScope(actor, dto.departmentId);
    }
    try {
      return await this.prisma.program.update({ where: { id }, data: dto });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('A program with this code already exists');
      }
      throw e;
    }
  }
}
