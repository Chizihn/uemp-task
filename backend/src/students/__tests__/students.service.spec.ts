import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { StudentsService } from '../students.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProfileLookupService } from '../../common/profile-lookup.service';

describe('StudentsService', () => {
  let service: StudentsService;
  let prisma: any;
  let profileLookup: any;

  beforeEach(async () => {
    prisma = {
      student: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      program: {
        findUnique: jest.fn(),
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
        StudentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProfileLookupService, useValue: profileLookup },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
  });

  describe('findAll', () => {
    it('scopes query to DEPT_ADMIN department', async () => {
      prisma.student.findMany.mockResolvedValue([]);
      prisma.student.count.mockResolvedValue(0);
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };

      await service.findAll(actor, {});

      expect(prisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ departmentId: 'dept-csc' }),
        }),
      );
    });

    it('throws ForbiddenException if DEPT_ADMIN requests a different department', async () => {
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };

      await expect(service.findAll(actor, { departmentId: 'dept-other' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('allows SUPER_ADMIN to query all departments or filter freely', async () => {
      prisma.student.findMany.mockResolvedValue([]);
      prisma.student.count.mockResolvedValue(0);
      const actor = { id: 'user-sa-1', email: 'admin@uemp.test', role: Role.SUPER_ADMIN };

      await service.findAll(actor, { departmentId: 'dept-math' });

      expect(prisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ departmentId: 'dept-math' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException if student does not exist', async () => {
      prisma.student.findUnique.mockResolvedValue(null);
      const actor = { id: 'user-sa-1', email: 'admin@uemp.test', role: Role.SUPER_ADMIN };

      await expect(service.findOne('stu-none', actor)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if DEPT_ADMIN views student in another department', async () => {
      prisma.student.findUnique.mockResolvedValue({
        id: 'stu-1',
        departmentId: 'dept-math',
      });
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };

      await expect(service.findOne('stu-1', actor)).rejects.toThrow(ForbiddenException);
    });

    it('returns student when authorized', async () => {
      const mockStudent = { id: 'stu-1', departmentId: 'dept-csc', matricNumber: 'CSC/2021/001' };
      prisma.student.findUnique.mockResolvedValue(mockStudent);
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };

      const result = await service.findOne('stu-1', actor);
      expect(result).toEqual(mockStudent);
    });
  });

  describe('create', () => {
    const createDto = {
      email: 'student@uemp.test',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      matricNumber: 'CSC/2021/001',
      departmentId: 'dept-csc',
      programId: 'prog-csc',
      level: 300,
    };

    it('throws BadRequestException if program does not belong to department', async () => {
      prisma.program.findUnique.mockResolvedValue({ id: 'prog-csc', departmentId: 'dept-other' });
      const actor = { id: 'user-sa-1', email: 'admin@uemp.test', role: Role.SUPER_ADMIN };

      await expect(service.create(createDto, actor)).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException on duplicate email or matric number (P2002)', async () => {
      prisma.program.findUnique.mockResolvedValue({ id: 'prog-csc', departmentId: 'dept-csc' });
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.0.0',
      });
      prisma.user.create.mockRejectedValue(prismaError);
      const actor = { id: 'user-sa-1', email: 'admin@uemp.test', role: Role.SUPER_ADMIN };

      await expect(service.create(createDto, actor)).rejects.toThrow(ConflictException);
    });

    it('successfully creates student profile within transaction', async () => {
      prisma.program.findUnique.mockResolvedValue({ id: 'prog-csc', departmentId: 'dept-csc' });
      prisma.user.create.mockResolvedValue({ id: 'user-new' });
      prisma.student.create.mockResolvedValue({ id: 'stu-new', matricNumber: createDto.matricNumber });
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };

      const result = await service.create(createDto, actor);
      expect(result.id).toBe('stu-new');
      expect(prisma.student.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-new',
            matricNumber: createDto.matricNumber,
          }),
        }),
      );
    });
  });

  describe('update', () => {
    const existingStudent = {
      id: 'stu-1',
      departmentId: 'dept-csc',
      programId: 'prog-csc',
      matricNumber: 'CSC/2021/001',
    };

    it('throws BadRequestException if updating to program in a different department', async () => {
      prisma.student.findUnique.mockResolvedValue(existingStudent);
      prisma.program.findUnique.mockResolvedValue({ id: 'prog-other', departmentId: 'dept-math' });
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };

      await expect(service.update('stu-1', { programId: 'prog-other' }, actor)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('successfully updates student', async () => {
      prisma.student.findUnique.mockResolvedValue(existingStudent);
      prisma.program.findUnique.mockResolvedValue({ id: 'prog-csc', departmentId: 'dept-csc' });
      prisma.student.update.mockResolvedValue({ ...existingStudent, level: 400 });
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };

      const result = await service.update('stu-1', { level: 400 }, actor);
      expect(result.level).toBe(400);
    });
  });
});
