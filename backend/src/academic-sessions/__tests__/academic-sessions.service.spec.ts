import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma, Term } from '@prisma/client';
import { AcademicSessionsService } from '../academic-sessions.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AcademicSessionsService', () => {
  let service: AcademicSessionsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      academicSession: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      semester: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcademicSessionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AcademicSessionsService>(AcademicSessionsService);
  });

  describe('findAll', () => {
    it('returns all sessions including semesters', async () => {
      prisma.academicSession.findMany.mockResolvedValue([
        { id: 'sess-1', name: '2025/2026', semesters: [] },
      ]);

      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(prisma.academicSession.findMany).toHaveBeenCalledWith({
        include: { semesters: true },
        orderBy: { name: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException if session does not exist', async () => {
      prisma.academicSession.findUnique.mockResolvedValue(null);

      await expect(service.findOne('sess-none')).rejects.toThrow(NotFoundException);
    });

    it('returns session when found', async () => {
      prisma.academicSession.findUnique.mockResolvedValue({ id: 'sess-1', name: '2025/2026' });

      const result = await service.findOne('sess-1');
      expect(result.id).toBe('sess-1');
    });
  });

  describe('create', () => {
    it('throws ConflictException on duplicate session name (P2002)', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.0.0',
      });
      prisma.academicSession.create.mockRejectedValue(prismaError);

      await expect(service.create({ name: '2025/2026' })).rejects.toThrow(ConflictException);
    });

    it('successfully creates session', async () => {
      prisma.academicSession.create.mockResolvedValue({ id: 'sess-1', name: '2025/2026' });

      const result = await service.create({ name: '2025/2026' });
      expect(result.name).toBe('2025/2026');
    });
  });

  describe('activateSession', () => {
    it('deactivates other sessions and activates selected session in transaction', async () => {
      prisma.academicSession.findUnique.mockResolvedValue({ id: 'sess-1' });
      prisma.academicSession.update.mockResolvedValue({ id: 'sess-1', isActive: true });

      const result = await service.activateSession('sess-1');

      expect(prisma.academicSession.updateMany).toHaveBeenCalledWith({
        where: { isActive: true },
        data: { isActive: false },
      });
      expect(prisma.academicSession.update).toHaveBeenCalledWith({
        where: { id: 'sess-1' },
        data: { isActive: true },
      });
      expect(result.isActive).toBe(true);
    });
  });

  describe('addSemester', () => {
    it('throws ConflictException on duplicate term in same session', async () => {
      prisma.academicSession.findUnique.mockResolvedValue({ id: 'sess-1' });
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.0.0',
      });
      prisma.semester.create.mockRejectedValue(prismaError);

      await expect(service.addSemester('sess-1', { term: Term.FIRST })).rejects.toThrow(
        ConflictException,
      );
    });

    it('creates semester for session', async () => {
      prisma.academicSession.findUnique.mockResolvedValue({ id: 'sess-1' });
      prisma.semester.create.mockResolvedValue({ id: 'sem-1', sessionId: 'sess-1', term: Term.FIRST });

      const result = await service.addSemester('sess-1', { term: Term.FIRST });
      expect(result.id).toBe('sem-1');
    });
  });

  describe('activateSemester', () => {
    it('throws NotFoundException if semester does not exist', async () => {
      prisma.semester.findUnique.mockResolvedValue(null);

      await expect(service.activateSemester('sem-none')).rejects.toThrow(NotFoundException);
    });

    it('activates semester and its parent session while deactivating others', async () => {
      prisma.semester.findUnique.mockResolvedValue({ id: 'sem-1', sessionId: 'sess-1' });
      prisma.semester.update.mockResolvedValue({ id: 'sem-1', isActive: true });

      const result = await service.activateSemester('sem-1');

      expect(prisma.semester.updateMany).toHaveBeenCalledWith({
        where: { isActive: true },
        data: { isActive: false },
      });
      expect(prisma.academicSession.updateMany).toHaveBeenCalledWith({
        where: { isActive: true },
        data: { isActive: false },
      });
      expect(prisma.academicSession.update).toHaveBeenCalledWith({
        where: { id: 'sess-1' },
        data: { isActive: true },
      });
      expect(prisma.semester.update).toHaveBeenCalledWith({
        where: { id: 'sem-1' },
        data: { isActive: true },
      });
      expect(result.isActive).toBe(true);
    });
  });

  describe('getActivePeriod', () => {
    it('throws NotFoundException if no active semester found', async () => {
      prisma.semester.findFirst.mockResolvedValue(null);

      await expect(service.getActivePeriod()).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException if active semester parent session is not active', async () => {
      prisma.semester.findFirst.mockResolvedValue({
        id: 'sem-1',
        session: { id: 'sess-1', isActive: false },
      });

      await expect(service.getActivePeriod()).rejects.toThrow(NotFoundException);
    });

    it('returns active session and semester', async () => {
      const activeSem = {
        id: 'sem-1',
        term: Term.FIRST,
        session: { id: 'sess-1', name: '2025/2026', isActive: true },
      };
      prisma.semester.findFirst.mockResolvedValue(activeSem);

      const result = await service.getActivePeriod();
      expect(result.session.id).toBe('sess-1');
      expect(result.semester.id).toBe('sem-1');
    });
  });
});
