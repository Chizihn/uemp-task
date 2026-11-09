import { Injectable } from '@nestjs/common';
import { Prisma, Role, ResultStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileLookupService } from '../common/profile-lookup.service';
import { AuthUser } from '../common/types/auth-user.interface';

interface PeriodFilter {
  sessionId?: string;
  semesterId?: string;
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileLookup: ProfileLookupService,
  ) {}

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
}
