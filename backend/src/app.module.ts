import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { UsersModule } from './users/users.module';
import { FacultiesModule } from './faculties/faculties.module';
import { DepartmentsModule } from './departments/departments.module';
import { ProgramsModule } from './programs/programs.module';
import { AcademicSessionsModule } from './academic-sessions/academic-sessions.module';
import { CoursesModule } from './courses/courses.module';
import { StudentsModule } from './students/students.module';
import { LecturersModule } from './lecturers/lecturers.module';
import { DeptAdminsModule } from './dept-admins/dept-admins.module';
import { CourseAllocationsModule } from './course-allocations/course-allocations.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { ResultsModule } from './results/results.module';
import { ReportsModule } from './reports/reports.module';
import { MediaModule } from './media/media.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CommonModule,
    AuthModule,
    AuditLogModule,
    UsersModule,
    FacultiesModule,
    DepartmentsModule,
    ProgramsModule,
    AcademicSessionsModule,
    CoursesModule,
    StudentsModule,
    LecturersModule,
    DeptAdminsModule,
    CourseAllocationsModule,
    RegistrationsModule,
    ResultsModule,
    ReportsModule,
    MediaModule,
  ],
  controllers: [AppController],
  providers: [
    // Order matters: authenticate first, then authorize by role.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
