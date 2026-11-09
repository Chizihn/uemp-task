import { Test, TestingModule } from '@nestjs/testing';
import { ResultStatus, Role } from '@prisma/client';
import { ReportsService } from '../reports.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProfileLookupService } from '../../common/profile-lookup.service';
import { AuditLogService } from '../../audit-log/audit-log.service';
import { ReportExportService } from '../report-export.service';
import { AuditAction } from '../../audit-log/audit-action.constants';

// Mock pdf-report.util functions so tests don't spend time generating real PDF binary streams
jest.mock('../pdf-report.util', () => ({
  buildRegistrationSummaryPdf: jest.fn().mockResolvedValue(Buffer.from('mock-reg-pdf')),
  buildPerformanceSummaryPdf: jest.fn().mockResolvedValue(Buffer.from('mock-perf-pdf')),
}));

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: any;
  let profileLookup: any;
  let auditLogService: any;
  let reportExportService: any;

  beforeEach(async () => {
    prisma = {
      academicSession: {
        findUnique: jest.fn(),
      },
      semester: {
        findUnique: jest.fn(),
      },
      registration: {
        findMany: jest.fn(),
      },
      result: {
        findMany: jest.fn(),
      },
    };

    profileLookup = {
      getDeptAdminDepartmentId: jest.fn().mockResolvedValue('dept-csc'),
      getLecturerProfile: jest.fn().mockResolvedValue({ id: 'lec-1' }),
    };

    auditLogService = {
      record: jest.fn().mockResolvedValue(undefined),
    };

    reportExportService = {
      uploadPdf: jest.fn().mockResolvedValue({ secureUrl: 'https://cdn.example.com/test.pdf' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProfileLookupService, useValue: profileLookup },
        { provide: AuditLogService, useValue: auditLogService },
        { provide: ReportExportService, useValue: reportExportService },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  describe('registrationSummary', () => {
    it('aggregates course registration counts scoped to department for DEPT_ADMIN', async () => {
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };
      prisma.registration.findMany.mockResolvedValue([
        {
          courseAllocation: {
            course: { id: 'c-1', code: 'CSC301', title: 'DB Systems', units: 3 },
          },
        },
        {
          courseAllocation: {
            course: { id: 'c-1', code: 'CSC301', title: 'DB Systems', units: 3 },
          },
        },
        {
          courseAllocation: {
            course: { id: 'c-2', code: 'CSC302', title: 'OS', units: 3 },
          },
        },
      ]);

      const result = await service.registrationSummary(actor, { sessionId: 'sess-1' });

      expect(profileLookup.getDeptAdminDepartmentId).toHaveBeenCalledWith('user-da-1');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        course: 'CSC301',
        title: 'DB Systems',
        units: 3,
        registered: 2,
      });
      expect(result[1]).toEqual({
        course: 'CSC302',
        title: 'OS',
        units: 3,
        registered: 1,
      });
    });

    it('runs unscoped for SUPER_ADMIN', async () => {
      const actor = { id: 'user-sa-1', email: 'admin@uemp.test', role: Role.SUPER_ADMIN };
      prisma.registration.findMany.mockResolvedValue([]);

      await service.registrationSummary(actor, {});

      expect(profileLookup.getDeptAdminDepartmentId).not.toHaveBeenCalled();
      expect(prisma.registration.findMany).toHaveBeenCalledWith({
        where: {
          courseAllocation: {
            sessionId: undefined,
            semesterId: undefined,
            course: { departmentId: undefined },
          },
        },
        include: expect.any(Object),
      });
    });
  });

  describe('performanceSummary', () => {
    it('aggregates approved results with averageScore and gradeDistribution for LECTURER', async () => {
      const actor = { id: 'user-lec-1', email: 'lec@uemp.test', role: Role.LECTURER };
      prisma.result.findMany.mockResolvedValue([
        {
          totalScore: 80,
          grade: 'A',
          registration: {
            courseAllocation: {
              course: { id: 'c-1', code: 'CSC301', title: 'DB Systems' },
            },
          },
        },
        {
          totalScore: 70,
          grade: 'B',
          registration: {
            courseAllocation: {
              course: { id: 'c-1', code: 'CSC301', title: 'DB Systems' },
            },
          },
        },
      ]);

      const result = await service.performanceSummary(actor, { sessionId: 'sess-1' });

      expect(profileLookup.getLecturerProfile).toHaveBeenCalledWith('user-lec-1');
      expect(prisma.result.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: ResultStatus.APPROVED,
            registration: expect.objectContaining({
              courseAllocation: expect.objectContaining({
                lecturerId: 'lec-1',
              }),
            }),
          }),
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        course: 'CSC301',
        title: 'DB Systems',
        studentsGraded: 2,
        averageScore: 75,
        gradeDistribution: { A: 1, B: 1 },
      });
    });
  });

  describe('exportRegistrationSummaryPdf', () => {
    it('generates pdf, triggers background archive, and logs REPORT_EXPORT audit', async () => {
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };
      prisma.registration.findMany.mockResolvedValue([]);
      prisma.academicSession.findUnique.mockResolvedValue({ id: 'sess-1', name: '2025/2026' });

      const result = await service.exportRegistrationSummaryPdf(actor, { sessionId: 'sess-1' });

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.filename).toMatch(/^registration-summary-\d+\.pdf$/);
      expect(auditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-da-1',
          action: AuditAction.REPORT_EXPORT,
          metadata: expect.objectContaining({ report: 'registration-summary' }),
        }),
      );
    });
  });

  describe('exportPerformanceSummaryPdf', () => {
    it('generates pdf, triggers background archive, and logs REPORT_EXPORT audit', async () => {
      const actor = { id: 'user-da-1', email: 'da@uemp.test', role: Role.DEPT_ADMIN };
      prisma.result.findMany.mockResolvedValue([]);
      prisma.academicSession.findUnique.mockResolvedValue({ id: 'sess-1', name: '2025/2026' });

      const result = await service.exportPerformanceSummaryPdf(actor, { sessionId: 'sess-1' });

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.filename).toMatch(/^performance-summary-\d+\.pdf$/);
      expect(auditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-da-1',
          action: AuditAction.REPORT_EXPORT,
          metadata: expect.objectContaining({ report: 'performance-summary' }),
        }),
      );
    });
  });
});
