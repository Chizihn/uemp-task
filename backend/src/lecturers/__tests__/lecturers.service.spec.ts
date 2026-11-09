import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { LecturersService } from '../lecturers.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProfileLookupService } from '../../common/profile-lookup.service';

describe('LecturersService', () => {
  let service: LecturersService;
  let prisma: any;
  let profileLookup: any;

  beforeEach(async () => {
    prisma = {
      lecturer: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      user: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    profileLookup = {
      getDeptAdminDepartmentId: jest.fn().mockResolvedValue('dept-csc'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LecturersService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProfileLookupService, useValue: profileLookup },
      ],
    }).compile();

    service = module.get<LecturersService>(LecturersService);
  });

  describe('findAll', () => {
    it('scopes query to DEPT_ADMIN department', async () => {
      prisma.lecturer.findMany.mockResolvedValue([]);
      prisma.lecturer.count.mockResolvedValue(0);
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };

      await service.findAll(actor, {});

      expect(prisma.lecturer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ departmentId: 'dept-csc' }),
        }),
      );
    });

    it('throws ForbiddenException if DEPT_ADMIN requests another department', async () => {
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };

      await expect(service.findAll(actor, { departmentId: 'dept-math' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('allows SUPER_ADMIN to query any department', async () => {
      prisma.lecturer.findMany.mockResolvedValue([]);
      prisma.lecturer.count.mockResolvedValue(0);
      const actor = { id: 'user-sa-1', email: 'admin@uemp.test', role: Role.SUPER_ADMIN };

      await service.findAll(actor, { departmentId: 'dept-math' });

      expect(prisma.lecturer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ departmentId: 'dept-math' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException if lecturer does not exist', async () => {
      prisma.lecturer.findUnique.mockResolvedValue(null);
      const actor = { id: 'user-sa-1', email: 'admin@uemp.test', role: Role.SUPER_ADMIN };

      await expect(service.findOne('lec-none', actor)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if DEPT_ADMIN views lecturer in another department', async () => {
      prisma.lecturer.findUnique.mockResolvedValue({
        id: 'lec-1',
        departmentId: 'dept-other',
      });
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };

      await expect(service.findOne('lec-1', actor)).rejects.toThrow(ForbiddenException);
    });

    it('returns lecturer when authorized', async () => {
      const mockLecturer = { id: 'lec-1', departmentId: 'dept-csc', staffId: 'STF/001' };
      prisma.lecturer.findUnique.mockResolvedValue(mockLecturer);
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };

      const result = await service.findOne('lec-1', actor);
      expect(result).toEqual(mockLecturer);
    });
  });

  describe('create', () => {
    const createDto = {
      email: 'lecturer@uemp.test',
      password: 'password123',
      firstName: 'Alan',
      lastName: 'Turing',
      staffId: 'STF/001',
      title: 'Professor',
      departmentId: 'dept-csc',
    };

    it('throws ForbiddenException if DEPT_ADMIN tries to create lecturer for another department', async () => {
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };
      profileLookup.getDeptAdminDepartmentId.mockResolvedValue('dept-math');

      await expect(service.create(createDto, actor)).rejects.toThrow(ForbiddenException);
    });

    it('throws ConflictException on duplicate email or staffId (P2002)', async () => {
      const actor = { id: 'user-sa-1', email: 'admin@uemp.test', role: Role.SUPER_ADMIN };
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.0.0',
      });
      prisma.user.create.mockRejectedValue(prismaError);

      await expect(service.create(createDto, actor)).rejects.toThrow(ConflictException);
    });

    it('creates lecturer profile in transaction', async () => {
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };
      prisma.user.create.mockResolvedValue({ id: 'user-lec-1' });
      prisma.lecturer.create.mockResolvedValue({ id: 'lec-new', staffId: createDto.staffId });

      const result = await service.create(createDto, actor);
      expect(result.id).toBe('lec-new');
      expect(prisma.lecturer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-lec-1',
            staffId: createDto.staffId,
          }),
        }),
      );
    });
  });

  describe('update', () => {
    const existingLecturer = {
      id: 'lec-1',
      departmentId: 'dept-csc',
      staffId: 'STF/001',
      title: 'Dr.',
    };

    it('throws ConflictException on duplicate staffId (P2002)', async () => {
      prisma.lecturer.findUnique.mockResolvedValue(existingLecturer);
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.0.0',
      });
      prisma.lecturer.update.mockRejectedValue(prismaError);
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };

      await expect(service.update('lec-1', { staffId: 'STF/002' }, actor)).rejects.toThrow(
        ConflictException,
      );
    });

    it('successfully updates lecturer title', async () => {
      prisma.lecturer.findUnique.mockResolvedValue(existingLecturer);
      prisma.lecturer.update.mockResolvedValue({ ...existingLecturer, title: 'Professor' });
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };

      const result = await service.update('lec-1', { title: 'Professor' }, actor);
      expect(result.title).toBe('Professor');
    });
  });
});
