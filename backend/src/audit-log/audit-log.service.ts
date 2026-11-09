import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogFilterDto } from './dto/audit-log-filter.dto';

export interface RecordAuditEventInput {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

const DEFAULT_PAGE_SIZE = 50;

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Writes one audit row. Accepts an optional Prisma transaction client so
   * callers can log in the same transaction as the mutation it describes —
   * the log entry should never exist without the action having committed.
   */
  async record(
    input: RecordAuditEventInput,
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    return tx.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        metadata: input.metadata as Prisma.InputJsonValue,
      },
    });
  }

  async list(filter: AuditLogFilterDto) {
    const where: Prisma.AuditLogWhereInput = {
      userId: filter.userId,
      action: filter.action,
      entityType: filter.entityType,
    };

    const skip = filter.skip ?? 0;
    const take = filter.take ?? DEFAULT_PAGE_SIZE;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              middleName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total, skip, take };
  }
}
