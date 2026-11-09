import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword } from '../common/utils/password.util';
import { CreateDeptAdminDto } from './dto/create-dept-admin.dto';

@Injectable()
export class DeptAdminsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(departmentId?: string) {
    return this.prisma.deptAdminProfile.findMany({
      where: { departmentId },
      include: {
        department: true,
        user: {
          select: { firstName: true, middleName: true, lastName: true, email: true, status: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const profile = await this.prisma.deptAdminProfile.findUnique({
      where: { id },
      include: {
        department: true,
        user: {
          select: { firstName: true, middleName: true, lastName: true, email: true, status: true },
        },
      },
    });
    if (!profile) {
      throw new NotFoundException('Department admin not found');
    }
    return profile;
  }

  async create(dto: CreateDeptAdminDto) {
    const department = await this.prisma.department.findUnique({ where: { id: dto.departmentId } });
    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const passwordHash = await hashPassword(dto.password);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: dto.email,
            passwordHash,
            role: Role.DEPT_ADMIN,
            firstName: dto.firstName,
            middleName: dto.middleName,
            lastName: dto.lastName,
          },
        });
        return tx.deptAdminProfile.create({
          data: { userId: user.id, departmentId: dto.departmentId },
          include: { department: true },
        });
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('A user with this email already exists');
      }
      throw e;
    }
  }
}
