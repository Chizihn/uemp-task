import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Resolves a logged-in user's role-scoped profile server-side. Every
 * scope-sensitive module (students, courses, registrations, results, ...)
 * uses this instead of trusting a departmentId/lecturerId/studentId the
 * client might send — the JWT only carries { id, email, role }, deliberately,
 * so scope is always re-derived here and can't go stale or be spoofed.
 */
@Injectable()
export class ProfileLookupService {
  constructor(private readonly prisma: PrismaService) {}

  async getDeptAdminDepartmentId(userId: string): Promise<string> {
    const profile = await this.prisma.deptAdminProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new ForbiddenException('No department admin profile is linked to this account');
    }
    return profile.departmentId;
  }

  async getLecturerProfile(userId: string) {
    const lecturer = await this.prisma.lecturer.findUnique({ where: { userId } });
    if (!lecturer) {
      throw new ForbiddenException('No lecturer profile is linked to this account');
    }
    return lecturer;
  }

  async getStudentProfile(userId: string) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) {
      throw new ForbiddenException('No student profile is linked to this account');
    }
    return student;
  }
}
