import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Role, ResultStatus } from '@prisma/client';
import { ResultsService } from '../results.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProfileLookupService } from '../../common/profile-lookup.service';
import { AuditLogService } from '../../audit-log/audit-log.service';
import { DEFAULT_GRADING_SCALE } from '../../common/utils/grade.util';

describe('ResultsService', () => {
  let service: ResultsService;
  let prisma: any;
  let profileLookup: any;
  let auditLogService: any;

  beforeEach(async () => {
    prisma = {
      gradingScale: {
        findMany: jest.fn().mockResolvedValue(DEFAULT_GRADING_SCALE),
      },
      courseAllocation: {
        findUnique: jest.fn(),
      },
      registration: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      result: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      student: {
        findUnique: jest.fn(),
      },
    };

    profileLookup = {
      getLecturerProfile: jest.fn(),
      getDeptAdminDepartmentId: jest.fn(),
      getStudentProfile: jest.fn(),
    };

    auditLogService = {
      record: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResultsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProfileLookupService, useValue: profileLookup },
        { provide: AuditLogService, useValue: auditLogService },
      ],
    }).compile();

    service = module.get<ResultsService>(ResultsService);
  });

  describe('saveDraft', () => {
    const actor = { id: 'user-lec-1', email: 'lecturer@uemp.test', role: Role.LECTURER };
    const mockRegistration = {
      id: 'reg-1',
      courseAllocation: {
        id: 'alloc-1',
        lecturerId: 'lec-1',
        course: { departmentId: 'dept-csc' },
      },
    };

    it('computes total score and grade when both CA and exam scores are provided', async () => {
      profileLookup.getLecturerProfile.mockResolvedValue({ id: 'lec-1' });
      prisma.registration.findUnique.mockResolvedValue(mockRegistration);
      prisma.result.findUnique.mockResolvedValue(null);
      prisma.result.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'res-1', ...data }),
      );

      const result = await service.saveDraft('reg-1', { caScore: 28, examScore: 50 }, actor);

      expect(result.totalScore).toBe(78);
      expect(result.grade).toBe('A');
      expect(result.gradePoint).toBe(5);
      expect(result.status).toBe(ResultStatus.DRAFT);
    });

    it('leaves total score and grade null when only partial score is provided', async () => {
      profileLookup.getLecturerProfile.mockResolvedValue({ id: 'lec-1' });
      prisma.registration.findUnique.mockResolvedValue(mockRegistration);
      prisma.result.findUnique.mockResolvedValue(null);
      prisma.result.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'res-1', ...data }),
      );

      const result = await service.saveDraft('reg-1', { caScore: 25 }, actor);

      expect(result.caScore).toBe(25);
      expect(result.examScore).toBeNull();
      expect(result.totalScore).toBeNull();
      expect(result.grade).toBeNull();
    });

    it('blocks lecturer not assigned to this course allocation', async () => {
      profileLookup.getLecturerProfile.mockResolvedValue({ id: 'other-lec' });
      prisma.registration.findUnique.mockResolvedValue(mockRegistration);

      await expect(
        service.saveDraft('reg-1', { caScore: 25, examScore: 50 }, actor),
      ).rejects.toThrow(
        new ForbiddenException('You can only manage results for courses assigned to you'),
      );
    });

    it('throws ConflictException if result is already submitted', async () => {
      profileLookup.getLecturerProfile.mockResolvedValue({ id: 'lec-1' });
      prisma.registration.findUnique.mockResolvedValue(mockRegistration);
      prisma.result.findUnique.mockResolvedValue({
        id: 'res-1',
        status: ResultStatus.SUBMITTED,
      });

      await expect(
        service.saveDraft('reg-1', { caScore: 25, examScore: 50 }, actor),
      ).rejects.toThrow(ConflictException);
    });

    it('allows re-editing a rejected result and returns it to DRAFT status', async () => {
      profileLookup.getLecturerProfile.mockResolvedValue({ id: 'lec-1' });
      prisma.registration.findUnique.mockResolvedValue(mockRegistration);
      prisma.result.findUnique.mockResolvedValue({
        id: 'res-1',
        status: ResultStatus.REJECTED,
        caScore: 20,
        examScore: 35,
      });
      prisma.result.update.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'res-1', ...data }),
      );

      const updated = await service.saveDraft('reg-1', { examScore: 45 }, actor);
      expect(updated.status).toBe(ResultStatus.DRAFT);
      expect(updated.totalScore).toBe(65);
      expect(updated.grade).toBe('B');
    });
  });

  describe('submit', () => {
    const actor = { id: 'user-lec-1', email: 'lecturer@uemp.test', role: Role.LECTURER };
    const mockRegistration = {
      id: 'reg-1',
      courseAllocation: {
        id: 'alloc-1',
        lecturerId: 'lec-1',
        course: { departmentId: 'dept-csc' },
      },
    };

    it('submits a complete draft result successfully', async () => {
      profileLookup.getLecturerProfile.mockResolvedValue({ id: 'lec-1' });
      prisma.registration.findUnique.mockResolvedValue(mockRegistration);
      prisma.result.findUnique.mockResolvedValue({
        id: 'res-1',
        status: ResultStatus.DRAFT,
        caScore: 28,
        examScore: 50,
      });
      prisma.result.update.mockResolvedValue({
        id: 'res-1',
        status: ResultStatus.SUBMITTED,
        submittedAt: new Date(),
      });

      const submitted = await service.submit('reg-1', actor);
      expect(submitted.status).toBe(ResultStatus.SUBMITTED);
    });

    it('rejects submission if examScore or caScore is missing', async () => {
      profileLookup.getLecturerProfile.mockResolvedValue({ id: 'lec-1' });
      prisma.registration.findUnique.mockResolvedValue(mockRegistration);
      prisma.result.findUnique.mockResolvedValue({
        id: 'res-1',
        status: ResultStatus.DRAFT,
        caScore: 28,
        examScore: null,
      });

      await expect(service.submit('reg-1', actor)).rejects.toThrow(
        new BadRequestException('Both CA and exam scores are required before submitting'),
      );
    });

    it('rejects submission if result is already submitted or approved', async () => {
      profileLookup.getLecturerProfile.mockResolvedValue({ id: 'lec-1' });
      prisma.registration.findUnique.mockResolvedValue(mockRegistration);
      prisma.result.findUnique.mockResolvedValue({
        id: 'res-1',
        status: ResultStatus.SUBMITTED,
        caScore: 28,
        examScore: 50,
      });

      await expect(service.submit('reg-1', actor)).rejects.toThrow(ConflictException);
    });
  });

  describe('approve, reject & reopen', () => {
    const deptAdmin = { id: 'user-da-1', email: 'deptadmin@uemp.test', role: Role.DEPT_ADMIN };

    it('approves a submitted result within department scope', async () => {
      profileLookup.getDeptAdminDepartmentId.mockResolvedValue('dept-csc');
      prisma.result.findUnique.mockResolvedValue({
        id: 'res-1',
        status: ResultStatus.SUBMITTED,
        registration: {
          courseAllocation: { course: { departmentId: 'dept-csc' } },
        },
      });
      prisma.result.update.mockResolvedValue({
        id: 'res-1',
        status: ResultStatus.APPROVED,
        reviewedById: 'user-da-1',
      });

      const approved = await service.approve('res-1', deptAdmin);
      expect(approved.status).toBe(ResultStatus.APPROVED);
    });

    it('rejects a submitted result and stores the rejection reason', async () => {
      profileLookup.getDeptAdminDepartmentId.mockResolvedValue('dept-csc');
      prisma.result.findUnique.mockResolvedValue({
        id: 'res-1',
        status: ResultStatus.SUBMITTED,
        registration: {
          courseAllocation: { course: { departmentId: 'dept-csc' } },
        },
      });
      prisma.result.update.mockResolvedValue({
        id: 'res-1',
        status: ResultStatus.REJECTED,
        rejectionReason: 'Transcription check needed',
      });

      const rejected = await service.reject('res-1', 'Transcription check needed', deptAdmin);
      expect(rejected.status).toBe(ResultStatus.REJECTED);
      expect(rejected.rejectionReason).toBe('Transcription check needed');
    });

    it('reopens an approved result back to DRAFT', async () => {
      profileLookup.getDeptAdminDepartmentId.mockResolvedValue('dept-csc');
      prisma.result.findUnique.mockResolvedValue({
        id: 'res-1',
        status: ResultStatus.APPROVED,
        registration: {
          courseAllocation: { course: { departmentId: 'dept-csc' } },
        },
      });
      prisma.result.update.mockResolvedValue({
        id: 'res-1',
        status: ResultStatus.DRAFT,
        reviewedById: null,
      });

      const reopened = await service.reopen('res-1', deptAdmin, 'Found scoring discrepancy');
      expect(reopened.status).toBe(ResultStatus.DRAFT);
      expect(reopened.reviewedById).toBeNull();
    });

    it('blocks foreign department admin from approving result', async () => {
      profileLookup.getDeptAdminDepartmentId.mockResolvedValue('dept-mth');
      prisma.result.findUnique.mockResolvedValue({
        id: 'res-1',
        status: ResultStatus.SUBMITTED,
        registration: {
          courseAllocation: { course: { departmentId: 'dept-csc' } },
        },
      });

      await expect(service.approve('res-1', deptAdmin)).rejects.toThrow(
        new ForbiddenException('You can only review results within your own department'),
      );
    });
  });

  describe('findMyResults', () => {
    it('returns only approved results and calculates semester GPA and cumulative CGPA', async () => {
      const studentActor = { id: 'u-std-1', email: 'student@uemp.test', role: Role.STUDENT };
      profileLookup.getStudentProfile.mockResolvedValue({ id: 'std-1' });

      // Student has CSC301 (3 units, Grade A = 5 GP) approved
      prisma.result.findMany.mockResolvedValue([
        {
          id: 'res-1',
          status: ResultStatus.APPROVED,
          caScore: 28,
          examScore: 50,
          totalScore: 78,
          grade: 'A',
          gradePoint: 5,
          registration: {
            id: 'reg-1',
            studentId: 'std-1',
            courseAllocation: {
              course: { code: 'CSC301', title: 'Software Engineering', units: 3 },
              session: { name: '2024/2025' },
              semester: { id: 'sem-1', term: 'FIRST' },
            },
          },
        },
      ]);

      const res = await service.findMyResults(studentActor);
      expect(res.cgpa).toBe(5);
      expect(res.semesters).toHaveLength(1);
      expect(res.semesters[0].gpa).toBe(5);
    });
  });
});
