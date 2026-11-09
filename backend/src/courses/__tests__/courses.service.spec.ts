import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma, Role, Term } from '@prisma/client';
import { CoursesService } from '../courses.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProfileLookupService } from '../../common/profile-lookup.service';

describe('CoursesService', () => {
  let service: CoursesService;
  let prisma: any;
  let profileLookup: any;

  beforeEach(async () => {
    prisma = {
      course: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    profileLookup = {
      getDeptAdminDepartmentId: jest.fn().mockResolvedValue('dept-csc'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProfileLookupService, useValue: profileLookup },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  describe('findAll', () => {
    it('returns courses and total with default pagination', async () => {
      prisma.course.findMany.mockResolvedValue([{ id: 'c-1', code: 'CSC101' }]);
      prisma.course.count.mockResolvedValue(1);

      const result = await service.findAll({ departmentId: 'dept-csc' });

      expect(prisma.course.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({ departmentId: 'dept-csc' }),
        include: { department: true },
        orderBy: { code: 'asc' },
        skip: 0,
        take: 50,
      });
      expect(result).toEqual({
        items: [{ id: 'c-1', code: 'CSC101' }],
        total: 1,
        skip: 0,
        take: 50,
      });
    });

    it('filters by search term in code or title', async () => {
      prisma.course.findMany.mockResolvedValue([]);
      prisma.course.count.mockResolvedValue(0);

      await service.findAll({ search: 'Intro' });

      expect(prisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { code: { contains: 'Intro', mode: 'insensitive' } },
              { title: { contains: 'Intro', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when course does not exist', async () => {
      prisma.course.findUnique.mockResolvedValue(null);

      await expect(service.findOne('c-none')).rejects.toThrow(NotFoundException);
    });

    it('returns course when found', async () => {
      const mockCourse = { id: 'c-1', code: 'CSC101', department: { name: 'Computer Science' } };
      prisma.course.findUnique.mockResolvedValue(mockCourse);

      const result = await service.findOne('c-1');
      expect(result).toEqual(mockCourse);
    });
  });

  describe('create', () => {
    const createDto = {
      code: 'CSC301',
      title: 'Database Systems',
      units: 3,
      level: 300,
      term: Term.FIRST,
      departmentId: 'dept-csc',
    };

    it('forbids DEPT_ADMIN from creating a course outside their department', async () => {
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };
      profileLookup.getDeptAdminDepartmentId.mockResolvedValue('dept-math');

      await expect(service.create(createDto, actor)).rejects.toThrow(ForbiddenException);
    });

    it('allows DEPT_ADMIN to create course within own department', async () => {
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };
      profileLookup.getDeptAdminDepartmentId.mockResolvedValue('dept-csc');
      prisma.course.create.mockResolvedValue({ id: 'c-new', ...createDto });

      const result = await service.create(createDto, actor);
      expect(result.id).toBe('c-new');
      expect(prisma.course.create).toHaveBeenCalledWith({ data: createDto });
    });

    it('allows SUPER_ADMIN to create course for any department', async () => {
      const actor = { id: 'user-sa-1', email: 'admin@uemp.test', role: Role.SUPER_ADMIN };
      prisma.course.create.mockResolvedValue({ id: 'c-new', ...createDto });

      const result = await service.create(createDto, actor);
      expect(result.id).toBe('c-new');
      expect(profileLookup.getDeptAdminDepartmentId).not.toHaveBeenCalled();
    });

    it('throws ConflictException when course code already exists', async () => {
      const actor = { id: 'user-sa-1', email: 'admin@uemp.test', role: Role.SUPER_ADMIN };
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.0.0',
      });
      prisma.course.create.mockRejectedValue(prismaError);

      await expect(service.create(createDto, actor)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    const existingCourse = {
      id: 'c-1',
      code: 'CSC301',
      title: 'Database Systems',
      units: 3,
      level: 300,
      term: Term.FIRST,
      departmentId: 'dept-csc',
    };

    it('forbids DEPT_ADMIN from updating course in another department', async () => {
      prisma.course.findUnique.mockResolvedValue(existingCourse);
      profileLookup.getDeptAdminDepartmentId.mockResolvedValue('dept-physics');
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };

      await expect(service.update('c-1', { title: 'Advanced DB' }, actor)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('allows update when authorized', async () => {
      prisma.course.findUnique.mockResolvedValue(existingCourse);
      profileLookup.getDeptAdminDepartmentId.mockResolvedValue('dept-csc');
      prisma.course.update.mockResolvedValue({ ...existingCourse, title: 'Advanced DB' });
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };

      const result = await service.update('c-1', { title: 'Advanced DB' }, actor);
      expect(result.title).toBe('Advanced DB');
    });

    it('throws ConflictException on duplicate course code update', async () => {
      prisma.course.findUnique.mockResolvedValue(existingCourse);
      profileLookup.getDeptAdminDepartmentId.mockResolvedValue('dept-csc');
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.0.0',
      });
      prisma.course.update.mockRejectedValue(prismaError);
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };

      await expect(service.update('c-1', { code: 'CSC302' }, actor)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
