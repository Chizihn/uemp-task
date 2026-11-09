import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../audit-log/audit-action.constants';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { UserFilterDto } from './dto/user-filter.dto';

const DEFAULT_PAGE_SIZE = 50;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll(filter: UserFilterDto) {
    const where: Prisma.UserWhereInput = {
      role: filter.role,
      status: filter.status,
      ...(filter.search
        ? {
            OR: [
              { email: { contains: filter.search, mode: 'insensitive' } },
              { firstName: { contains: filter.search, mode: 'insensitive' } },
              { lastName: { contains: filter.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const skip = filter.skip ?? 0;
    const take = filter.take ?? DEFAULT_PAGE_SIZE;

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          student: { select: { matricNumber: true, department: { select: { name: true } } } },
          lecturer: { select: { staffId: true, department: { select: { name: true } } } },
          deptAdminProfile: { select: { department: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, skip, take };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateStatus(id: string, status: UserStatus, actorId: string) {
    const user = await this.findOne(id);
    const updated = await this.prisma.user.update({ where: { id }, data: { status } });

    await this.auditLogService.record({
      userId: actorId,
      action: status === UserStatus.ACTIVE ? AuditAction.USER_ACTIVATE : AuditAction.USER_SUSPEND,
      entityType: 'User',
      entityId: id,
      metadata: { previousStatus: user.status, newStatus: status },
    });

    return updated;
  }

  async updateMyProfile(userId: string, dto: UpdateMyProfileDto) {
    const updated = await this.prisma.user.update({ where: { id: userId }, data: dto });
    await this.auditLogService.record({
      userId,
      action: AuditAction.PROFILE_UPDATE,
      entityType: 'User',
      entityId: userId,
    });
    return updated;
  }
}
