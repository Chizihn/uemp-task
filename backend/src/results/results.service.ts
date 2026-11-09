import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, ResultStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileLookupService } from '../common/profile-lookup.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../audit-log/audit-action.constants';
import { AuthUser } from '../common/types/auth-user.interface';
import { DEFAULT_GRADING_SCALE, resolveGrade } from '../common/utils/grade.util';
import { calculateGpa } from '../common/utils/gpa.util';
import { SaveDraftDto } from './dto/save-draft.dto';
import { PendingResultsFilterDto } from './dto/pending-results-filter.dto';

const registrationInclude = {
  student: { include: { user: { select: { email: true } } } },
  courseAllocation: {
    include: { course: true, lecturer: true, session: true, semester: true },
  },
} satisfies Prisma.RegistrationInclude;

const DEFAULT_PAGE_SIZE = 50;

@Injectable()
export class ResultsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileLookup: ProfileLookupService,
    private readonly auditLogService: AuditLogService,
  ) {}

  private async loadGradingScale() {
    const rows = await this.prisma.gradingScale.findMany();
    return rows.length > 0 ? rows : DEFAULT_GRADING_SCALE;
  }

  /** LECTURER must own the allocation; DEPT_ADMIN must own its department; SUPER_ADMIN unrestricted. */
  private async assertCanAccessAllocation(
    actor: AuthUser,
    allocation: { lecturerId: string; course: { departmentId: string } },
  ) {
    if (actor.role === Role.LECTURER) {
      const lecturer = await this.profileLookup.getLecturerProfile(actor.id);
      if (allocation.lecturerId !== lecturer.id) {
        throw new ForbiddenException('You can only manage results for courses assigned to you');
      }
    } else if (actor.role === Role.DEPT_ADMIN) {
      const departmentId = await this.profileLookup.getDeptAdminDepartmentId(actor.id);
      if (allocation.course.departmentId !== departmentId) {
        throw new ForbiddenException('You can only view results within your own department');
      }
    }
  }

  async getClassList(courseAllocationId: string, actor: AuthUser) {
    const allocation = await this.prisma.courseAllocation.findUnique({
      where: { id: courseAllocationId },
      include: { course: true },
    });
    if (!allocation) {
      throw new NotFoundException('Course allocation not found');
    }
    await this.assertCanAccessAllocation(actor, allocation);

    const registrations = await this.prisma.registration.findMany({
      where: { courseAllocationId },
      include: { ...registrationInclude, result: true },
      orderBy: { student: { matricNumber: 'asc' } },
    });

    return { allocation, registrations };
  }

  /** Create-or-edit a result as a draft. Only the owning lecturer; only while DRAFT or REJECTED. */
  async saveDraft(registrationId: string, dto: SaveDraftDto, actor: AuthUser) {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: registrationInclude,
    });
    if (!registration) {
      throw new NotFoundException('Registration not found');
    }
    await this.assertCanAccessAllocation(actor, registration.courseAllocation);

    const existing = await this.prisma.result.findUnique({ where: { registrationId } });
    if (
      existing &&
      existing.status !== ResultStatus.DRAFT &&
      existing.status !== ResultStatus.REJECTED
    ) {
      throw new ConflictException(
        'This result has already been submitted and can no longer be edited without a department reopen',
      );
    }

    const caScore = dto.caScore ?? existing?.caScore ?? null;
    const examScore = dto.examScore ?? existing?.examScore ?? null;

    let totalScore: number | null = null;
    let grade: string | null = null;
    let gradePoint: number | null = null;
    if (caScore !== null && examScore !== null) {
      totalScore = caScore + examScore;
      const scale = await this.loadGradingScale();
      const resolved = resolveGrade(totalScore, scale);
      grade = resolved.grade;
      gradePoint = resolved.gradePoint;
    }

    const data = {
      caScore,
      examScore,
      totalScore,
      grade,
      gradePoint,
      status: ResultStatus.DRAFT,
    };

    const result = existing
      ? await this.prisma.result.update({ where: { registrationId }, data })
      : await this.prisma.result.create({ data: { registrationId, ...data } });

    await this.auditLogService.record({
      userId: actor.id,
      action: AuditAction.RESULT_SAVE_DRAFT,
      entityType: 'Result',
      entityId: result.id,
    });

    return result;
  }

  async submit(registrationId: string, actor: AuthUser) {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: registrationInclude,
    });
    if (!registration) {
      throw new NotFoundException('Registration not found');
    }
    await this.assertCanAccessAllocation(actor, registration.courseAllocation);

    const result = await this.prisma.result.findUnique({ where: { registrationId } });
    if (!result) {
      throw new BadRequestException('Save a draft with both scores before submitting');
    }
    if (result.status !== ResultStatus.DRAFT) {
      throw new ConflictException(`Cannot submit a result that is already ${result.status}`);
    }
    if (result.caScore === null || result.examScore === null) {
      throw new BadRequestException('Both CA and exam scores are required before submitting');
    }

    const updated = await this.prisma.result.update({
      where: { registrationId },
      data: { status: ResultStatus.SUBMITTED, submittedAt: new Date() },
    });

    await this.auditLogService.record({
      userId: actor.id,
      action: AuditAction.RESULT_SUBMIT,
      entityType: 'Result',
      entityId: updated.id,
    });

    return updated;
  }

  /** Dept Admin's review queue (Workflow 3, step 2). */
  async findPending(actor: AuthUser, filter: PendingResultsFilterDto) {
    const studentWhere: Prisma.StudentWhereInput = {
      ...(filter.search
        ? {
            OR: [
              { matricNumber: { contains: filter.search, mode: 'insensitive' } },
              { user: { email: { contains: filter.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const registrationWhere: Prisma.RegistrationWhereInput = {
      courseAllocationId: filter.courseAllocationId,
      student: Object.keys(studentWhere).length > 0 ? studentWhere : undefined,
    };

    if (actor.role === Role.DEPT_ADMIN) {
      const departmentId = await this.profileLookup.getDeptAdminDepartmentId(actor.id);
      registrationWhere.courseAllocation = { course: { departmentId } };
    }

    const where: Prisma.ResultWhereInput = {
      status: ResultStatus.SUBMITTED,
      registration: registrationWhere,
    };

    const skip = filter.skip ?? 0;
    const take = filter.take ?? DEFAULT_PAGE_SIZE;

    const [items, total] = await Promise.all([
      this.prisma.result.findMany({
        where,
        include: { registration: { include: registrationInclude } },
        orderBy: { submittedAt: 'asc' },
        skip,
        take,
      }),
      this.prisma.result.count({ where }),
    ]);

    return { items, total, skip, take };
  }

  private async loadResultInDeptScope(resultId: string, actor: AuthUser) {
    const result = await this.prisma.result.findUnique({
      where: { id: resultId },
      include: { registration: { include: registrationInclude } },
    });
    if (!result) {
      throw new NotFoundException('Result not found');
    }
    if (actor.role === Role.DEPT_ADMIN) {
      const departmentId = await this.profileLookup.getDeptAdminDepartmentId(actor.id);
      if (result.registration.courseAllocation.course.departmentId !== departmentId) {
        throw new ForbiddenException('You can only review results within your own department');
      }
    }
    return result;
  }

  private async assertCanReview(resultId: string, actor: AuthUser) {
    const result = await this.loadResultInDeptScope(resultId, actor);
    if (result.status !== ResultStatus.SUBMITTED) {
      throw new ConflictException(`Cannot review a result that is ${result.status}, not SUBMITTED`);
    }
    return result;
  }

  async approve(resultId: string, actor: AuthUser) {
    await this.assertCanReview(resultId, actor);

    const updated = await this.prisma.result.update({
      where: { id: resultId },
      data: { status: ResultStatus.APPROVED, reviewedById: actor.id, reviewedAt: new Date() },
    });

    await this.auditLogService.record({
      userId: actor.id,
      action: AuditAction.RESULT_APPROVE,
      entityType: 'Result',
      entityId: resultId,
    });

    return updated;
  }

  async reject(resultId: string, reason: string, actor: AuthUser) {
    await this.assertCanReview(resultId, actor);

    const updated = await this.prisma.result.update({
      where: { id: resultId },
      data: {
        status: ResultStatus.REJECTED,
        rejectionReason: reason,
        reviewedById: actor.id,
        reviewedAt: new Date(),
      },
    });

    await this.auditLogService.record({
      userId: actor.id,
      action: AuditAction.RESULT_REJECT,
      entityType: 'Result',
      entityId: resultId,
      metadata: { reason },
    });

    return updated;
  }

  /**
   * "Authorized reopening" (spec §2.B restriction / §6.8): unlocks an already
   * APPROVED (published) result back to DRAFT so the lecturer can correct and
   * resubmit it through the normal flow. A SUBMITTED result doesn't need this
   * — `reject` already sends it back for correction before it's published.
   */
  async reopen(resultId: string, actor: AuthUser, reason?: string) {
    const result = await this.loadResultInDeptScope(resultId, actor);
    if (result.status !== ResultStatus.APPROVED) {
      throw new ConflictException('Only an approved (published) result can be reopened');
    }

    const updated = await this.prisma.result.update({
      where: { id: resultId },
      data: { status: ResultStatus.DRAFT, reviewedById: null, reviewedAt: null },
    });

    await this.auditLogService.record({
      userId: actor.id,
      action: AuditAction.RESULT_REOPEN,
      entityType: 'Result',
      entityId: resultId,
      metadata: reason ? { reason } : undefined,
    });

    return updated;
  }

  /** Lecturer's own submission status + feedback across all their courses. */
  async findMySubmissions(actor: AuthUser) {
    const lecturer = await this.profileLookup.getLecturerProfile(actor.id);
    return this.prisma.result.findMany({
      where: { registration: { courseAllocation: { lecturerId: lecturer.id } } },
      include: { registration: { include: registrationInclude } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Student's own results — approved only (business rule §6.6: students never
   * see a result until it's been through departmental approval), grouped by
   * semester with a computed GPA per semester and a running CGPA.
   */
  async findMyResults(actor: AuthUser) {
    const student = await this.profileLookup.getStudentProfile(actor.id);

    const results = await this.prisma.result.findMany({
      where: {
        status: ResultStatus.APPROVED,
        registration: { studentId: student.id },
      },
      include: { registration: { include: registrationInclude } },
    });

    const bySemester = new Map<
      string,
      { session: string; semester: string; results: typeof results }
    >();
    for (const r of results) {
      const semester = r.registration.courseAllocation.semester;
      const session = r.registration.courseAllocation.session;
      const key = semester.id;
      if (!bySemester.has(key)) {
        bySemester.set(key, { session: session.name, semester: semester.term, results: [] });
      }
      bySemester.get(key)!.results.push(r);
    }

    const semesters = Array.from(bySemester.values()).map((group) => ({
      session: group.session,
      semester: group.semester,
      results: group.results,
      gpa: calculateGpa(
        group.results.map((r) => ({
          units: r.registration.courseAllocation.course.units,
          gradePoint: r.gradePoint!,
        })),
      ),
    }));

    const cgpa = calculateGpa(
      results.map((r) => ({
        units: r.registration.courseAllocation.course.units,
        gradePoint: r.gradePoint!,
      })),
    );

    return { semesters, cgpa };
  }
}
