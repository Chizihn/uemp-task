import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FacultiesService } from '../faculties.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('FacultiesService', () => {
  let service: FacultiesService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      faculty: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FacultiesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<FacultiesService>(FacultiesService);
  });

  describe('findAll', () => {
    it('returns all faculties ordered by name asc', async () => {
      prisma.faculty.findMany.mockResolvedValue([{ id: 'fac-1', name: 'Science', code: 'SCI' }]);

      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(prisma.faculty.findMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } });
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException if faculty not found', async () => {
      prisma.faculty.findUnique.mockResolvedValue(null);

      await expect(service.findOne('fac-none')).rejects.toThrow(NotFoundException);
    });

    it('returns faculty when found', async () => {
      prisma.faculty.findUnique.mockResolvedValue({ id: 'fac-1', name: 'Science' });

      const result = await service.findOne('fac-1');
      expect(result.id).toBe('fac-1');
    });
  });

  describe('create', () => {
    it('throws ConflictException on duplicate faculty code (P2002)', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.0.0',
      });
      prisma.faculty.create.mockRejectedValue(prismaError);

      await expect(service.create({ name: 'Science', code: 'SCI' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('creates faculty', async () => {
      prisma.faculty.create.mockResolvedValue({ id: 'fac-1', name: 'Science', code: 'SCI' });

      const result = await service.create({ name: 'Science', code: 'SCI' });
      expect(result.code).toBe('SCI');
    });
  });

  describe('update', () => {
    it('throws NotFoundException if updating non-existent faculty', async () => {
      prisma.faculty.findUnique.mockResolvedValue(null);

      await expect(service.update('fac-none', { name: 'New Sci' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('updates faculty', async () => {
      prisma.faculty.findUnique.mockResolvedValue({ id: 'fac-1', name: 'Science', code: 'SCI' });
      prisma.faculty.update.mockResolvedValue({ id: 'fac-1', name: 'Faculty of Science', code: 'SCI' });

      const result = await service.update('fac-1', { name: 'Faculty of Science' });
      expect(result.name).toBe('Faculty of Science');
    });
  });
});
