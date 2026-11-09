import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogService } from '../audit-log.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      auditLog: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
  });

  describe('record', () => {
    it('creates auditLog record using default prisma client', async () => {
      const input = {
        userId: 'u-1',
        action: 'auth.login',
        entityType: 'User',
        entityId: 'u-1',
        metadata: { ip: '127.0.0.1' },
      };
      prisma.auditLog.create.mockResolvedValue({ id: 'log-1', ...input });

      const result = await service.record(input);

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'u-1',
          action: 'auth.login',
          entityType: 'User',
          entityId: 'u-1',
          metadata: { ip: '127.0.0.1' },
        },
      });
      expect(result.id).toBe('log-1');
    });

    it('uses provided transaction client when passed', async () => {
      const customTx = {
        auditLog: {
          create: jest.fn().mockResolvedValue({ id: 'log-tx' }),
        },
      };
      const input = {
        userId: 'u-2',
        action: 'result.approve',
        entityType: 'Result',
      };

      await service.record(input, customTx as any);

      expect(customTx.auditLog.create).toHaveBeenCalled();
      expect(prisma.auditLog.create).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('returns paginated audit logs with user info', async () => {
      prisma.auditLog.findMany.mockResolvedValue([{ id: 'log-1', action: 'auth.login' }]);
      prisma.auditLog.count.mockResolvedValue(1);

      const result = await service.list({ action: 'auth.login' });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          userId: undefined,
          action: 'auth.login',
          entityType: undefined,
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 50,
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
      });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});
