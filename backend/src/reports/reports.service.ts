import { Injectable, Logger } from '@nestjs/common';
import { Prisma, Role, ResultStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileLookupService } from '../common/profile-lookup.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../audit-log/audit-action.constants';
import { AuthUser } from '../common/types/auth-user.interface';
import { ReportExportService } from './report-export.service';
import { buildRegistrationSummaryPdf, buildPerformanceSummaryPdf } from './pdf-report.util';

interface PeriodFilter {
  sessionId?: string;
  semesterId?: string;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly profileLookup: ProfileLookupService,
    private readonly auditLogService: AuditLogService,
    private readonly reportExportService: ReportExportService,
  ) {}

  private async resolvePeriodLabel(filter: PeriodFilter): Promise<string> {
    if (!filter.sessionId) return 'All sessions';
    const session = await this.prisma.academicSession.findUnique({
      where: { id: filter.sessionId },
    });
    if (!filter.semesterId) return session?.name ?? 'All sessions';
    const semester = await this.prisma.semester.findUnique({ where: { id: filter.semesterId } });
    return `${session?.name ?? 'Unknown session'} — ${semester?.term ?? ''}`.trim();
  }

  private async resolveDepartmentFilter(actor: AuthUser): Promise<string | undefined> {
    if (actor.role === Role.DEPT_ADMIN) {
      return this.profileLookup.getDeptAdminDepartmentId(actor.id);
    }
    return undefined; // Super Admin: university-wide
  }

  /** Lecturers only ever see a performance snapshot of courses assigned to them. */
  private async resolveLecturerFilter(actor: AuthUser): Promise<string | undefined> {
    if (actor.role === Role.LECTURER) {
      const lecturer = await this.profileLookup.getLecturerProfile(actor.id);
      return lecturer.id;
    }
    return undefined;
  }

  /** Per-course registration counts — "basic departmental reports" (spec §2.C) / university-wide for Super Admin. */
  async registrationSummary(actor: AuthUser, filter: PeriodFilter) {
    const departmentId = await this.resolveDepartmentFilter(actor);

    const where: Prisma.RegistrationWhereInput = {
      courseAllocation: {
        sessionId: filter.sessionId,
        semesterId: filter.semesterId,
        course: { departmentId },
      },
    };

    const registrations = await this.prisma.registration.findMany({
      where,
      include: { courseAllocation: { include: { course: true } } },
    });

    const byCourse = new Map<
      string,
      { course: string; title: string; units: number; registered: number }
    >();
    for (const r of registrations) {
      const course = r.courseAllocation.course;
      const row = byCourse.get(course.id) ?? {
        course: course.code,
        title: course.title,
        units: course.units,
        registered: 0,
      };
      row.registered += 1;
      byCourse.set(course.id, row);
    }

    return Array.from(byCourse.values()).sort((a, b) => a.course.localeCompare(b.course));
  }

  /**
   * Per-course performance snapshot from approved results — average score +
   * grade distribution. Dept Admin/Super Admin see it department-wide /
   * university-wide; a Lecturer only sees their own assigned courses
   * (spec §2.B: "view basic course and student performance summaries").
   */
  async performanceSummary(actor: AuthUser, filter: PeriodFilter) {
    const departmentId = await this.resolveDepartmentFilter(actor);
    const lecturerId = await this.resolveLecturerFilter(actor);

    const results = await this.prisma.result.findMany({
      where: {
        status: ResultStatus.APPROVED,
        registration: {
          courseAllocation: {
            sessionId: filter.sessionId,
            semesterId: filter.semesterId,
            lecturerId,
            course: { departmentId },
          },
        },
      },
      include: { registration: { include: { courseAllocation: { include: { course: true } } } } },
    });

    const byCourse = new Map<
      string,
      {
        course: string;
        title: string;
        count: number;
        totalScoreSum: number;
        grades: Record<string, number>;
      }
    >();

    for (const r of results) {
      const course = r.registration.courseAllocation.course;
      const row = byCourse.get(course.id) ?? {
        course: course.code,
        title: course.title,
        count: 0,
        totalScoreSum: 0,
        grades: {},
      };
      row.count += 1;
      row.totalScoreSum += r.totalScore ?? 0;
      row.grades[r.grade ?? 'N/A'] = (row.grades[r.grade ?? 'N/A'] ?? 0) + 1;
      byCourse.set(course.id, row);
    }

    return Array.from(byCourse.values())
      .map((row) => ({
        course: row.course,
        title: row.title,
        studentsGraded: row.count,
        averageScore: row.count > 0 ? Math.round((row.totalScoreSum / row.count) * 100) / 100 : 0,
        gradeDistribution: row.grades,
      }))
      .sort((a, b) => a.course.localeCompare(b.course));
  }

  async exportRegistrationSummaryPdf(actor: AuthUser, filter: PeriodFilter) {
    const [rows, periodLabel] = await Promise.all([
      this.registrationSummary(actor, filter),
      this.resolvePeriodLabel(filter),
    ]);
    const pdf = await buildRegistrationSummaryPdf(rows, periodLabel);
    const filename = `registration-summary-${Date.now()}.pdf`;

    // Archive a copy to Cloudinary for the institution's records, but never let that block or
    // fail the actual download — the browser gets the bytes straight from this response either way.
    this.reportExportService
      .uploadPdf(pdf, filename.replace(/\.pdf$/, ''))
      .catch((e: unknown) =>
        this.logger.warn(
          `Cloudinary report archive failed: ${e instanceof Error ? e.message : String(e)}`,
        ),
      );

    await this.auditLogService.record({
      userId: actor.id,
      action: AuditAction.REPORT_EXPORT,
      entityType: 'Report',
      entityId: null,
      metadata: { report: 'registration-summary', ...filter },
    });

    return { buffer: pdf, filename };
  }

  async exportPerformanceSummaryPdf(actor: AuthUser, filter: PeriodFilter) {
    const [rows, periodLabel] = await Promise.all([
      this.performanceSummary(actor, filter),
      this.resolvePeriodLabel(filter),
    ]);
    const pdf = await buildPerformanceSummaryPdf(rows, periodLabel);
    const filename = `performance-summary-${Date.now()}.pdf`;

    this.reportExportService
      .uploadPdf(pdf, filename.replace(/\.pdf$/, ''))
      .catch((e: unknown) =>
        this.logger.warn(
          `Cloudinary report archive failed: ${e instanceof Error ? e.message : String(e)}`,
        ),
      );

    await this.auditLogService.record({
      userId: actor.id,
      action: AuditAction.REPORT_EXPORT,
      entityType: 'Report',
      entityId: null,
      metadata: { report: 'performance-summary', ...filter },
    });

    return { buffer: pdf, filename };
  }
}
