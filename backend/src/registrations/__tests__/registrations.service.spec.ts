import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { RegistrationsService } from '../registrations.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProfileLookupService } from '../../common/profile-lookup.service';
import { AcademicSessionsService } from '../../academic-sessions/academic-sessions.service';
import { AuditLogService } from '../../audit-log/audit-log.service';
import { AuditAction } from '../../audit-log/audit-action.constants';

describe('RegistrationsService', () => {
  let service: RegistrationsService;
  let prisma: any;
  let profileLookup: any;
  let academicSessionsService: any;
  let auditLogService: any;

  const mockStudent = {
    id: 'student-1',
    userId: 'user-stu-1',
    departmentId: 'dept-csc',
    level: 300,
  };

  const mockActivePeriod = {
    session: { id: 'session-2025', name: '2025/2026' },
    semester: { id: 'sem-harmattan', name: 'Harmattan', term: 'HARMATTAN' },
  };

  beforeEach(async () => {
    prisma = {
      registration: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      courseAllocation: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    profileLookup = {
      getStudentProfile: jest.fn().mockResolvedValue(mockStudent),
      getDeptAdminDepartmentId: jest.fn().mockResolvedValue('dept-csc'),
    };

    academicSessionsService = {
      getActivePeriod: jest.fn().mockResolvedValue(mockActivePeriod),
    };

    auditLogService = {
      record: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProfileLookupService, useValue: profileLookup },
        { provide: AcademicSessionsService, useValue: academicSessionsService },
        { provide: AuditLogService, useValue: auditLogService },
      ],
    }).compile();

    service = module.get<RegistrationsService>(RegistrationsService);
  });

  describe('findEligibleAllocations', () => {
    it('returns allocations matching student department and level excluding already registered', async () => {
      prisma.registration.findMany.mockResolvedValue([{ courseAllocationId: 'alloc-1' }]);
      prisma.courseAllocation.findMany.mockResolvedValue([
        { id: 'alloc-2', course: { code: 'CSC302', units: 3 } },
      ]);

      const result = await service.findEligibleAllocations('user-stu-1');

      expect(prisma.registration.findMany).toHaveBeenCalledWith({
        where: { studentId: 'student-1' },
        select: { courseAllocationId: true },
      });
      expect(prisma.courseAllocation.findMany).toHaveBeenCalledWith({
        where: {
          sessionId: 'session-2025',
          semesterId: 'sem-harmattan',
          id: { notIn: ['alloc-1'] },
          course: {
            departmentId: 'dept-csc',
            level: 300,
            isActive: true,
          },
        },
        include: expect.any(Object),
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('register', () => {
    const validAllocation = {
      id: 'alloc-1',
      sessionId: 'session-2025',
      semesterId: 'sem-harmattan',
      course: {
        id: 'c-1',
        code: 'CSC301',
        departmentId: 'dept-csc',
        level: 300,
        units: 3,
        isActive: true,
      },
    };

    it('throws NotFoundException if allocation does not exist', async () => {
      prisma.courseAllocation.findUnique.mockResolvedValue(null);

      await expect(service.register('user-stu-1', 'alloc-nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException if allocation is not for the active semester', async () => {
      prisma.courseAllocation.findUnique.mockResolvedValue({
        ...validAllocation,
        semesterId: 'sem-other',
      });

      await expect(service.register('user-stu-1', 'alloc-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws ForbiddenException if course does not match student department or level', async () => {
      prisma.courseAllocation.findUnique.mockResolvedValue({
        ...validAllocation,
        course: { ...validAllocation.course, departmentId: 'dept-other' },
      });

      await expect(service.register('user-stu-1', 'alloc-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws BadRequestException if course is inactive', async () => {
      prisma.courseAllocation.findUnique.mockResolvedValue({
        ...validAllocation,
        course: { ...validAllocation.course, isActive: false },
      });

      await expect(service.register('user-stu-1', 'alloc-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException if credit limit (24 units) would be exceeded', async () => {
      prisma.courseAllocation.findUnique.mockResolvedValue({
        ...validAllocation,
        course: { ...validAllocation.course, units: 4 },
      });
      // Existing courses total 22 units -> 22 + 4 = 26 > 24
      prisma.registration.findMany.mockResolvedValue([
        { courseAllocation: { course: { units: 22 } } },
      ]);

      await expect(service.register('user-stu-1', 'alloc-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws ConflictException on duplicate registration (P2002)', async () => {
      prisma.courseAllocation.findUnique.mockResolvedValue(validAllocation);
      prisma.registration.findMany.mockResolvedValue([]);
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.0.0',
      });
      prisma.registration.create.mockRejectedValue(prismaError);

      await expect(service.register('user-stu-1', 'alloc-1')).rejects.toThrow(ConflictException);
    });

    it('successfully registers course and logs audit entry', async () => {
      prisma.courseAllocation.findUnique.mockResolvedValue(validAllocation);
      prisma.registration.findMany.mockResolvedValue([
        { courseAllocation: { course: { units: 15 } } },
      ]);
      const createdReg = { id: 'reg-new', studentId: 'student-1', courseAllocationId: 'alloc-1' };
      prisma.registration.create.mockResolvedValue(createdReg);

      const result = await service.register('user-stu-1', 'alloc-1');

      expect(result).toEqual(createdReg);
      expect(auditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-stu-1',
          action: AuditAction.REGISTER_COURSE,
          entityType: 'Registration',
          entityId: 'reg-new',
        }),
      );
    });
  });

  describe('findMyRegistrations', () => {
    it('returns registrations and calculates totalUnits', async () => {
      prisma.registration.findMany.mockResolvedValue([
        { id: 'r1', courseAllocation: { course: { units: 3 } } },
        { id: 'r2', courseAllocation: { course: { units: 4 } } },
      ]);

      const result = await service.findMyRegistrations('user-stu-1', {
        sessionId: 'session-2025',
      });

      expect(result.registrations).toHaveLength(2);
      expect(result.totalUnits).toBe(7);
    });
  });

  describe('findForDepartment', () => {
    it('scopes query to department if actor is DEPT_ADMIN', async () => {
      prisma.registration.findMany.mockResolvedValue([]);
      prisma.registration.count.mockResolvedValue(0);

      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };
      await service.findForDepartment(actor, { sessionId: 'session-2025' });

      expect(profileLookup.getDeptAdminDepartmentId).toHaveBeenCalledWith('user-da-1');
      expect(prisma.registration.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            student: expect.objectContaining({ departmentId: 'dept-csc' }),
          }),
        }),
      );
    });

    it('does not scope to department if actor is SUPER_ADMIN', async () => {
      prisma.registration.findMany.mockResolvedValue([]);
      prisma.registration.count.mockResolvedValue(0);

      const actor = { id: 'user-sa-1', email: 'admin@uemp.test', role: Role.SUPER_ADMIN };
      await service.findForDepartment(actor, { sessionId: 'session-2025' });

      expect(profileLookup.getDeptAdminDepartmentId).not.toHaveBeenCalled();
    });
  });

  describe('withdraw', () => {
    it('throws NotFoundException if registration not found or owned by different student', async () => {
      prisma.registration.findUnique.mockResolvedValue({
        id: 'reg-1',
        studentId: 'student-other',
      });

      await expect(service.withdraw('user-stu-1', 'reg-1')).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException if result already entered', async () => {
      prisma.registration.findUnique.mockResolvedValue({
        id: 'reg-1',
        studentId: 'student-1',
        result: { id: 'res-1', score: 70 },
      });

      await expect(service.withdraw('user-stu-1', 'reg-1')).rejects.toThrow(ConflictException);
    });

    it('successfully deletes registration when no result exists', async () => {
      prisma.registration.findUnique.mockResolvedValue({
        id: 'reg-1',
        studentId: 'student-1',
        result: null,
      });
      prisma.registration.delete.mockResolvedValue({ id: 'reg-1' });

      const result = await service.withdraw('user-stu-1', 'reg-1');

      expect(prisma.registration.delete).toHaveBeenCalledWith({ where: { id: 'reg-1' } });
      expect(result).toEqual({ success: true });
    });
  });
});
