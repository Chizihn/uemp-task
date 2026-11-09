import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DepartmentsService } from '../departments.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('DepartmentsService', () => {
  let service: DepartmentsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      department: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DepartmentsService>(DepartmentsService);
  });

  describe('findAll', () => {
    it('returns departments, optionally filtered by facultyId', async () => {
      prisma.department.findMany.mockResolvedValue([
        { id: 'dept-1', name: 'Computer Science', code: 'CSC', facultyId: 'fac-1' },
      ]);

      const result = await service.findAll('fac-1');
      expect(result).toHaveLength(1);
      expect(prisma.department.findMany).toHaveBeenCalledWith({
        where: { facultyId: 'fac-1' },
        include: { faculty: true },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException if department does not exist', async () => {
      prisma.department.findUnique.mockResolvedValue(null);

      await expect(service.findOne('dept-none')).rejects.toThrow(NotFoundException);
    });

    it('returns department when found', async () => {
      prisma.department.findUnique.mockResolvedValue({ id: 'dept-1', name: 'Computer Science' });

      const result = await service.findOne('dept-1');
      expect(result.id).toBe('dept-1');
    });
  });

  describe('create', () => {
    it('throws ConflictException on duplicate department code (P2002)', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.0.0',
      });
      prisma.department.create.mockRejectedValue(prismaError);

      await expect(
        service.create({ name: 'Computer Science', code: 'CSC', facultyId: 'fac-1' }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates department', async () => {
      prisma.department.create.mockResolvedValue({
        id: 'dept-1',
        name: 'Computer Science',
        code: 'CSC',
        facultyId: 'fac-1',
      });

      const result = await service.create({
        name: 'Computer Science',
        code: 'CSC',
        facultyId: 'fac-1',
      });
      expect(result.code).toBe('CSC');
    });
  });

  describe('update', () => {
    it('updates department', async () => {
      prisma.department.findUnique.mockResolvedValue({ id: 'dept-1', name: 'Comp Sci' });
      prisma.department.update.mockResolvedValue({ id: 'dept-1', name: 'Computer Science' });

      const result = await service.update('dept-1', { name: 'Computer Science' });
      expect(result.name).toBe('Computer Science');
    });
  });
});
