import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DeptAdminsService } from '../dept-admins.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../audit-log/audit-log.service';
import { AuditAction } from '../../audit-log/audit-action.constants';

describe('DeptAdminsService', () => {
  let service: DeptAdminsService;
  let prisma: any;
  let auditLogService: any;

  beforeEach(async () => {
    prisma = {
      deptAdminProfile: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      department: {
        findUnique: jest.fn(),
      },
      user: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    auditLogService = {
      record: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeptAdminsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogService, useValue: auditLogService },
      ],
    }).compile();

    service = module.get<DeptAdminsService>(DeptAdminsService);
  });

  describe('findAll', () => {
    it('returns dept admin profiles filtered by departmentId if provided', async () => {
      prisma.deptAdminProfile.findMany.mockResolvedValue([{ id: 'da-1' }]);

      const result = await service.findAll('dept-csc');

      expect(prisma.deptAdminProfile.findMany).toHaveBeenCalledWith({
        where: { departmentId: 'dept-csc' },
        include: expect.any(Object),
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException if profile does not exist', async () => {
      prisma.deptAdminProfile.findUnique.mockResolvedValue(null);

      await expect(service.findOne('da-none')).rejects.toThrow(NotFoundException);
    });

    it('returns profile if found', async () => {
      const mockProfile = { id: 'da-1', departmentId: 'dept-csc' };
      prisma.deptAdminProfile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.findOne('da-1');
      expect(result).toEqual(mockProfile);
    });
  });

  describe('create', () => {
    const createDto = {
      email: 'da@uemp.test',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Smith',
      departmentId: 'dept-csc',
    };

    it('throws NotFoundException if department does not exist', async () => {
      prisma.department.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException on duplicate email (P2002)', async () => {
      prisma.department.findUnique.mockResolvedValue({ id: 'dept-csc' });
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.0.0',
      });
      prisma.user.create.mockRejectedValue(prismaError);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('successfully creates dept admin profile in transaction', async () => {
      prisma.department.findUnique.mockResolvedValue({ id: 'dept-csc' });
      prisma.user.create.mockResolvedValue({ id: 'user-da-1' });
      prisma.deptAdminProfile.create.mockResolvedValue({ id: 'da-1', departmentId: 'dept-csc' });

      const result = await service.create(createDto);
      expect(result.id).toBe('da-1');
      expect(prisma.deptAdminProfile.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { userId: 'user-da-1', departmentId: 'dept-csc' },
        }),
      );
    });
  });

  describe('update (reassign)', () => {
    const existingProfile = { id: 'da-1', departmentId: 'dept-csc' };

    it('throws NotFoundException if target department does not exist', async () => {
      prisma.deptAdminProfile.findUnique.mockResolvedValue(existingProfile);
      prisma.department.findUnique.mockResolvedValue(null);

      await expect(
        service.update('da-1', { departmentId: 'dept-math' }, 'actor-sa-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('reassigns department and logs audit record', async () => {
      prisma.deptAdminProfile.findUnique.mockResolvedValue(existingProfile);
      prisma.department.findUnique.mockResolvedValue({ id: 'dept-math' });
      prisma.deptAdminProfile.update.mockResolvedValue({ id: 'da-1', departmentId: 'dept-math' });

      const result = await service.update('da-1', { departmentId: 'dept-math' }, 'actor-sa-1');

      expect(result.departmentId).toBe('dept-math');
      expect(auditLogService.record).toHaveBeenCalledWith({
        userId: 'actor-sa-1',
        action: AuditAction.DEPT_ADMIN_REASSIGN,
        entityType: 'DeptAdminProfile',
        entityId: 'da-1',
        metadata: {
          previousDepartmentId: 'dept-csc',
          newDepartmentId: 'dept-math',
        },
      });
    });
  });
});
