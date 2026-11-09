import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileLookupService } from '../common/profile-lookup.service';
import { AcademicSessionsService } from '../academic-sessions/academic-sessions.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../audit-log/audit-action.constants';
import { AuthUser } from '../common/types/auth-user.interface';
import { MAX_UNITS_PER_SEMESTER } from './registrations.constants';
import { RegistrationFilterDto } from './dto/registration-filter.dto';

const allocationInclude = {
  course: true,
  lecturer: { include: { department: true } },
  session: true,
  semester: true,
} satisfies Prisma.CourseAllocationInclude;

const DEFAULT_PAGE_SIZE = 50;

@Injectable()
export class RegistrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileLookup: ProfileLookupService,
    private readonly academicSessionsService: AcademicSessionsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * Courses the logged-in student can register for right now: their own
   * department + level, offered as a CourseAllocation in the currently
   * active session/semester, not already registered. Eligibility is
   * re-derived server-side from the student's profile every call — never
   * trusted from the client.
   */
  async findEligibleAllocations(userId: string) {
    const student = await this.profileLookup.getStudentProfile(userId);
    const { session, semester } = await this.academicSessionsService.getActivePeriod();

    const alreadyRegistered = await this.prisma.registration.findMany({
      where: { studentId: student.id },
      select: { courseAllocationId: true },
    });
    const excludedIds = alreadyRegistered.map((r) => r.courseAllocationId);

    return this.prisma.courseAllocation.findMany({
      where: {
        sessionId: session.id,
        semesterId: semester.id,
        id: { notIn: excludedIds },
        course: {
          departmentId: student.departmentId,
          level: student.level,
          isActive: true,
        },
      },
      include: allocationInclude,
    });
  }

  async register(userId: string, courseAllocationId: string) {
    const student = await this.profileLookup.getStudentProfile(userId);
    const { session, semester } = await this.academicSessionsService.getActivePeriod();

    const allocation = await this.prisma.courseAllocation.findUnique({
      where: { id: courseAllocationId },
      include: allocationInclude,
    });
    if (!allocation) {
      throw new NotFoundException('Course allocation not found');
    }

    // Business rule §6.1: only the student's own department + level, and only
    // for the currently active semester — the allocation's existence for that
    // semester is the authoritative "offered now" signal, not Course.term
    // (which is just the catalog's normal offering term and may legitimately
    // differ for an off-cycle/resit offering).
    if (allocation.sessionId !== session.id || allocation.semesterId !== semester.id) {
      throw new BadRequestException('This course is not being offered in the current semester');
    }
    if (
      allocation.course.departmentId !== student.departmentId ||
      allocation.course.level !== student.level
    ) {
      throw new ForbiddenException(
        'This course is not available to your department/level. Prerequisite checking beyond ' +
          'department/level/semester eligibility is out of scope for this MVP.',
      );
    }
    if (!allocation.course.isActive) {
      throw new BadRequestException('This course is not currently active');
    }

    const existingRegistrations = await this.prisma.registration.findMany({
      where: {
        studentId: student.id,
        courseAllocation: { sessionId: session.id, semesterId: semester.id },
      },
      include: { courseAllocation: { include: { course: true } } },
    });
    const currentUnits = existingRegistrations.reduce(
      (sum, r) => sum + r.courseAllocation.course.units,
      0,
    );
    if (currentUnits + allocation.course.units > MAX_UNITS_PER_SEMESTER) {
      throw new BadRequestException(
        `Registering this course would exceed the ${MAX_UNITS_PER_SEMESTER}-unit credit limit for the semester`,
      );
    }

    try {
      const registration = await this.prisma.registration.create({
        data: { studentId: student.id, courseAllocationId },
        include: { courseAllocation: { include: allocationInclude } },
      });

      await this.auditLogService.record({
        userId,
        action: AuditAction.REGISTER_COURSE,
        entityType: 'Registration',
        entityId: registration.id,
        metadata: { courseCode: allocation.course.code },
      });

      return registration;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('You are already registered for this course this semester');
      }
      throw e;
    }
  }

  async findMyRegistrations(userId: string, filter: { sessionId?: string; semesterId?: string }) {
    const student = await this.profileLookup.getStudentProfile(userId);
    const registrations = await this.prisma.registration.findMany({
      where: {
        studentId: student.id,
        courseAllocation: {
          sessionId: filter.sessionId,
          semesterId: filter.semesterId,
        },
      },
      include: { courseAllocation: { include: allocationInclude }, result: true },
      orderBy: { registeredAt: 'desc' },
    });

    const totalUnits = registrations.reduce((sum, r) => sum + r.courseAllocation.course.units, 0);
    return { registrations, totalUnits };
  }

  /** Departmental oversight (spec Workflow 1, step 7) — Dept Admin audits their students' registrations. */
  async findForDepartment(actor: AuthUser, filter: RegistrationFilterDto) {
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

    const where: Prisma.RegistrationWhereInput = {
      studentId: filter.studentId,
      courseAllocationId: filter.courseAllocationId,
      courseAllocation: { sessionId: filter.sessionId, semesterId: filter.semesterId },
      student: Object.keys(studentWhere).length > 0 ? studentWhere : undefined,
    };

    if (actor.role === Role.DEPT_ADMIN) {
      const departmentId = await this.profileLookup.getDeptAdminDepartmentId(actor.id);
      where.student = { ...studentWhere, departmentId };
    }

    const skip = filter.skip ?? 0;
    const take = filter.take ?? DEFAULT_PAGE_SIZE;

    const [items, total] = await Promise.all([
      this.prisma.registration.findMany({
        where,
        include: {
          student: { include: { user: { select: { email: true } } } },
          courseAllocation: { include: allocationInclude },
        },
        orderBy: { registeredAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.registration.count({ where }),
    ]);

    return { items, total, skip, take };
  }

  /** Self-withdrawal before any result has been entered — simple correction path for mis-registrations. */
  async withdraw(userId: string, registrationId: string) {
    const student = await this.profileLookup.getStudentProfile(userId);
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: { result: true },
    });

    if (!registration || registration.studentId !== student.id) {
      throw new NotFoundException('Registration not found');
    }
    if (registration.result) {
      throw new ConflictException(
        'Cannot withdraw — a result has already been entered for this course',
      );
    }

    await this.prisma.registration.delete({ where: { id: registrationId } });
    return { success: true };
  }
}
