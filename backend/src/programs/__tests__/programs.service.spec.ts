import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { ProgramsService } from '../programs.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProfileLookupService } from '../../common/profile-lookup.service';

describe('ProgramsService', () => {
  let service: ProgramsService;
  let prisma: any;
  let profileLookup: any;

  beforeEach(async () => {
    prisma = {
      program: {
        findMany: jest.fn(),
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
        ProgramsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProfileLookupService, useValue: profileLookup },
      ],
    }).compile();

    service = module.get<ProgramsService>(ProgramsService);
  });

  describe('findAll', () => {
    it('returns programs optionally filtered by departmentId', async () => {
      prisma.program.findMany.mockResolvedValue([
        { id: 'prog-1', name: 'B.Sc. Computer Science', code: 'BSC-CSC' },
      ]);

      const result = await service.findAll('dept-csc');
      expect(result).toHaveLength(1);
      expect(prisma.program.findMany).toHaveBeenCalledWith({
        where: { departmentId: 'dept-csc' },
        include: { department: true },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException if program does not exist', async () => {
      prisma.program.findUnique.mockResolvedValue(null);

      await expect(service.findOne('prog-none')).rejects.toThrow(NotFoundException);
    });

    it('returns program if found', async () => {
      prisma.program.findUnique.mockResolvedValue({ id: 'prog-1', name: 'B.Sc. Computer Science' });

      const result = await service.findOne('prog-1');
      expect(result.id).toBe('prog-1');
    });
  });

  describe('create', () => {
    const createDto = {
      name: 'B.Sc. Computer Science',
      code: 'BSC-CSC',
      departmentId: 'dept-csc',
      durationYears: 4,
      maxLevel: 400,
    };

    it('throws ForbiddenException if DEPT_ADMIN creates program for another department', async () => {
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };
      profileLookup.getDeptAdminDepartmentId.mockResolvedValue('dept-math');

      await expect(service.create(createDto, actor)).rejects.toThrow(ForbiddenException);
    });

    it('throws ConflictException on duplicate program code (P2002)', async () => {
      const actor = { id: 'user-sa-1', email: 'admin@uemp.test', role: Role.SUPER_ADMIN };
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.0.0',
      });
      prisma.program.create.mockRejectedValue(prismaError);

      await expect(service.create(createDto, actor)).rejects.toThrow(ConflictException);
    });

    it('creates program when authorized', async () => {
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };
      prisma.program.create.mockResolvedValue({ id: 'prog-1', ...createDto });

      const result = await service.create(createDto, actor);
      expect(result.id).toBe('prog-1');
    });
  });

  describe('update', () => {
    const existingProgram = {
      id: 'prog-1',
      name: 'B.Sc. Computer Science',
      code: 'BSC-CSC',
      departmentId: 'dept-csc',
    };

    it('throws ForbiddenException if DEPT_ADMIN tries to update program in another department', async () => {
      prisma.program.findUnique.mockResolvedValue({
        ...existingProgram,
        departmentId: 'dept-math',
      });
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };

      await expect(service.update('prog-1', { name: 'New Name' }, actor)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ForbiddenException if DEPT_ADMIN tries to move program to another department', async () => {
      prisma.program.findUnique.mockResolvedValue(existingProgram);
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };

      await expect(
        service.update('prog-1', { departmentId: 'dept-math' }, actor),
      ).rejects.toThrow(ForbiddenException);
    });

    it('updates program when authorized', async () => {
      prisma.program.findUnique.mockResolvedValue(existingProgram);
      prisma.program.update.mockResolvedValue({ ...existingProgram, name: 'B.Sc. Software Eng' });
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };

      const result = await service.update('prog-1', { name: 'B.Sc. Software Eng' }, actor);
      expect(result.name).toBe('B.Sc. Software Eng');
    });
  });
});
