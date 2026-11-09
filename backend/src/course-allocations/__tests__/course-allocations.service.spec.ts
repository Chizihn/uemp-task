import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma, ResultStatus, Role } from '@prisma/client';
import { CourseAllocationsService } from '../course-allocations.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProfileLookupService } from '../../common/profile-lookup.service';

describe('CourseAllocationsService', () => {
  let service: CourseAllocationsService;
  let prisma: any;
  let profileLookup: any;

  beforeEach(async () => {
    prisma = {
      courseAllocation: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      course: {
        findUnique: jest.fn(),
      },
      lecturer: {
        findUnique: jest.fn(),
      },
      result: {
        count: jest.fn(),
      },
    };

    profileLookup = {
      getDeptAdminDepartmentId: jest.fn().mockResolvedValue('dept-csc'),
      getLecturerProfile: jest.fn().mockResolvedValue({ id: 'lec-1', departmentId: 'dept-csc' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseAllocationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProfileLookupService, useValue: profileLookup },
      ],
    }).compile();

    service = module.get<CourseAllocationsService>(CourseAllocationsService);
  });

  describe('findAll', () => {
    it('scopes query to department when actor is DEPT_ADMIN', async () => {
      prisma.courseAllocation.findMany.mockResolvedValue([]);
      prisma.courseAllocation.count.mockResolvedValue(0);
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };

      await service.findAll(actor, {});

      expect(profileLookup.getDeptAdminDepartmentId).toHaveBeenCalledWith('user-da-1');
      expect(prisma.courseAllocation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            course: expect.objectContaining({ departmentId: 'dept-csc' }),
          }),
        }),
      );
    });

    it('scopes query to lecturerId when actor is LECTURER', async () => {
      prisma.courseAllocation.findMany.mockResolvedValue([]);
      prisma.courseAllocation.count.mockResolvedValue(0);
      const actor = { id: 'user-lec-1', email: 'lec@uemp.test', role: Role.LECTURER };

      await service.findAll(actor, {});

      expect(profileLookup.getLecturerProfile).toHaveBeenCalledWith('user-lec-1');
      expect(prisma.courseAllocation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ lecturerId: 'lec-1' }),
        }),
      );
    });

    it('does not scope when actor is SUPER_ADMIN', async () => {
      prisma.courseAllocation.findMany.mockResolvedValue([]);
      prisma.courseAllocation.count.mockResolvedValue(0);
      const actor = { id: 'user-sa-1', email: 'admin@uemp.test', role: Role.SUPER_ADMIN };

      await service.findAll(actor, {});

      expect(profileLookup.getDeptAdminDepartmentId).not.toHaveBeenCalled();
      expect(profileLookup.getLecturerProfile).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException if allocation does not exist', async () => {
      prisma.courseAllocation.findUnique.mockResolvedValue(null);
      const actor = { id: 'user-sa-1', email: 'admin@uemp.test', role: Role.SUPER_ADMIN };

      await expect(service.findOne('alloc-none', actor)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if DEPT_ADMIN accesses course outside own department', async () => {
      prisma.courseAllocation.findUnique.mockResolvedValue({
        id: 'alloc-1',
        course: { departmentId: 'dept-other' },
        lecturerId: null,
      });
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };

      await expect(service.findOne('alloc-1', actor)).rejects.toThrow(ForbiddenException);
    });

    it('returns allocation if DEPT_ADMIN owns the course department', async () => {
      const mockAlloc = {
        id: 'alloc-1',
        course: { departmentId: 'dept-csc' },
        lecturerId: 'lec-1',
      };
      prisma.courseAllocation.findUnique.mockResolvedValue(mockAlloc);
      prisma.lecturer.findUnique.mockResolvedValue({ id: 'lec-1', departmentId: 'dept-csc' });
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };

      const result = await service.findOne('alloc-1', actor);
      expect(result).toEqual(mockAlloc);
    });
  });

  describe('create', () => {
    const createDto = {
      courseId: 'c-1',
      sessionId: 'sess-1',
      semesterId: 'sem-1',
      lecturerId: 'lec-1',
    };

    it('throws NotFoundException if course does not exist', async () => {
      prisma.course.findUnique.mockResolvedValue(null);
      const actor = { id: 'user-sa-1', email: 'admin@uemp.test', role: Role.SUPER_ADMIN };

      await expect(service.create(createDto, actor)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if DEPT_ADMIN assigns course from another department', async () => {
      prisma.course.findUnique.mockResolvedValue({ id: 'c-1', departmentId: 'dept-other' });
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };

      await expect(service.create(createDto, actor)).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException if DEPT_ADMIN assigns lecturer from another department', async () => {
      prisma.course.findUnique.mockResolvedValue({ id: 'c-1', departmentId: 'dept-csc' });
      prisma.lecturer.findUnique.mockResolvedValue({ id: 'lec-1', departmentId: 'dept-other' });
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };

      await expect(service.create(createDto, actor)).rejects.toThrow(ForbiddenException);
    });

    it('throws ConflictException on duplicate assignment for session/semester (P2002)', async () => {
      prisma.course.findUnique.mockResolvedValue({ id: 'c-1', departmentId: 'dept-csc' });
      prisma.lecturer.findUnique.mockResolvedValue({ id: 'lec-1', departmentId: 'dept-csc' });
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.0.0',
      });
      prisma.courseAllocation.create.mockRejectedValue(prismaError);
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };

      await expect(service.create(createDto, actor)).rejects.toThrow(ConflictException);
    });

    it('successfully creates allocation', async () => {
      prisma.course.findUnique.mockResolvedValue({ id: 'c-1', departmentId: 'dept-csc' });
      prisma.lecturer.findUnique.mockResolvedValue({ id: 'lec-1', departmentId: 'dept-csc' });
      prisma.courseAllocation.create.mockResolvedValue({ id: 'alloc-new', ...createDto });
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };

      const result = await service.create(createDto, actor);
      expect(result.id).toBe('alloc-new');
    });
  });

  describe('update', () => {
    const existingAlloc = {
      id: 'alloc-1',
      course: { id: 'c-1', departmentId: 'dept-csc' },
      lecturerId: 'lec-1',
    };

    it('throws ConflictException if results already submitted or approved', async () => {
      prisma.courseAllocation.findUnique.mockResolvedValue(existingAlloc);
      prisma.lecturer.findUnique.mockResolvedValue({ id: 'lec-1', departmentId: 'dept-csc' });
      prisma.result.count.mockResolvedValue(2); // 2 results locked (non-DRAFT)
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };

      await expect(service.update('alloc-1', { lecturerId: 'lec-2' }, actor)).rejects.toThrow(
        ConflictException,
      );
    });

    it('allows reassigning lecturer if results are still drafts or empty', async () => {
      prisma.courseAllocation.findUnique.mockResolvedValue(existingAlloc);
      prisma.lecturer.findUnique.mockResolvedValue({ id: 'lec-1', departmentId: 'dept-csc' });
      prisma.result.count.mockResolvedValue(0);
      prisma.courseAllocation.update.mockResolvedValue({ ...existingAlloc, lecturerId: 'lec-2' });
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };

      const result = await service.update('alloc-1', { lecturerId: 'lec-2' }, actor);
      expect(result.lecturerId).toBe('lec-2');
    });
  });
});
