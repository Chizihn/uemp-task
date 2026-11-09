import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { CreateSemesterDto } from './dto/create-semester.dto';

@Injectable()
export class AcademicSessionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.academicSession.findMany({
      include: { semesters: true },
      orderBy: { name: 'desc' },
    });
  }

  async findOne(id: string) {
    const session = await this.prisma.academicSession.findUnique({
      where: { id },
      include: { semesters: true },
    });
    if (!session) {
      throw new NotFoundException('Academic session not found');
    }
    return session;
  }

  async create(dto: CreateSessionDto) {
    try {
      return await this.prisma.academicSession.create({ data: dto });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('An academic session with this name already exists');
      }
      throw e;
    }
  }

  /** Exactly one session is active at a time — activating one deactivates the rest. */
  async activateSession(id: string) {
    await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      await tx.academicSession.updateMany({ where: { isActive: true }, data: { isActive: false } });
      return tx.academicSession.update({ where: { id }, data: { isActive: true } });
    });
  }

  async addSemester(sessionId: string, dto: CreateSemesterDto) {
    await this.findOne(sessionId);
    try {
      return await this.prisma.semester.create({ data: { sessionId, term: dto.term } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('This session already has a semester for that term');
      }
      throw e;
    }
  }

  /**
   * Exactly one semester is "current" system-wide — activating one deactivates
   * every other semester (any session) and makes its parent session the
   * active one too, so `getActivePeriod()` below always resolves unambiguously.
   */
  async activateSemester(semesterId: string) {
    const semester = await this.prisma.semester.findUnique({ where: { id: semesterId } });
    if (!semester) {
      throw new NotFoundException('Semester not found');
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.semester.updateMany({ where: { isActive: true }, data: { isActive: false } });
      await tx.academicSession.updateMany({ where: { isActive: true }, data: { isActive: false } });
      await tx.academicSession.update({
        where: { id: semester.sessionId },
        data: { isActive: true },
      });
      return tx.semester.update({ where: { id: semesterId }, data: { isActive: true } });
    });
  }

  /** The single source of truth for "now" — used by registration eligibility and reporting. */
  async getActivePeriod() {
    const semester = await this.prisma.semester.findFirst({
      where: { isActive: true },
      include: { session: true },
    });
    if (!semester || !semester.session.isActive) {
      throw new NotFoundException('No active academic session/semester has been configured yet');
    }
    return { session: semester.session, semester };
  }
}
