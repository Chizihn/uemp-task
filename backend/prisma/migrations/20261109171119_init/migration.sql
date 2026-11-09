-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'LECTURER', 'DEPT_ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "Term" AS ENUM ('FIRST', 'SECOND', 'THIRD');

-- CreateEnum
CREATE TYPE "ResultStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "avatarUrl" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faculties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "durationYears" INTEGER NOT NULL,
    "maxLevel" INTEGER NOT NULL DEFAULT 500,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matricNumber" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecturers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "title" TEXT,
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecturers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dept_admin_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dept_admin_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_sessions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semesters" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "term" "Term" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "semesters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "units" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "term" "Term" NOT NULL,
    "departmentId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_allocations" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "lecturerId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrations" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseAllocationId" TEXT NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "results" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "caScore" DOUBLE PRECISION,
    "examScore" DOUBLE PRECISION,
    "totalScore" DOUBLE PRECISION,
    "grade" TEXT,
    "gradePoint" DOUBLE PRECISION,
    "status" "ResultStatus" NOT NULL DEFAULT 'DRAFT',
    "rejectionReason" TEXT,
    "reviewedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grading_scale" (
    "id" TEXT NOT NULL,
    "minScore" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "grade" TEXT NOT NULL,
    "gradePoint" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "grading_scale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "faculties_code_key" ON "faculties"("code");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE INDEX "departments_facultyId_idx" ON "departments"("facultyId");

-- CreateIndex
CREATE UNIQUE INDEX "programs_code_key" ON "programs"("code");

-- CreateIndex
CREATE INDEX "programs_departmentId_idx" ON "programs"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "students_userId_key" ON "students"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "students_matricNumber_key" ON "students"("matricNumber");

-- CreateIndex
CREATE INDEX "students_departmentId_idx" ON "students"("departmentId");

-- CreateIndex
CREATE INDEX "students_programId_idx" ON "students"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "lecturers_userId_key" ON "lecturers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "lecturers_staffId_key" ON "lecturers"("staffId");

-- CreateIndex
CREATE INDEX "lecturers_departmentId_idx" ON "lecturers"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "dept_admin_profiles_userId_key" ON "dept_admin_profiles"("userId");

-- CreateIndex
CREATE INDEX "dept_admin_profiles_departmentId_idx" ON "dept_admin_profiles"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "academic_sessions_name_key" ON "academic_sessions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "semesters_sessionId_term_key" ON "semesters"("sessionId", "term");

-- CreateIndex
CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");

-- CreateIndex
CREATE INDEX "courses_departmentId_idx" ON "courses"("departmentId");

-- CreateIndex
CREATE INDEX "courses_departmentId_level_term_idx" ON "courses"("departmentId", "level", "term");

-- CreateIndex
CREATE INDEX "course_allocations_lecturerId_idx" ON "course_allocations"("lecturerId");

-- CreateIndex
CREATE INDEX "course_allocations_sessionId_semesterId_idx" ON "course_allocations"("sessionId", "semesterId");

-- CreateIndex
CREATE UNIQUE INDEX "course_allocations_courseId_sessionId_semesterId_key" ON "course_allocations"("courseId", "sessionId", "semesterId");

-- CreateIndex
CREATE INDEX "registrations_studentId_idx" ON "registrations"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_studentId_courseAllocationId_key" ON "registrations"("studentId", "courseAllocationId");

-- CreateIndex
CREATE UNIQUE INDEX "results_registrationId_key" ON "results"("registrationId");

-- CreateIndex
CREATE INDEX "results_status_idx" ON "results"("status");

-- CreateIndex
CREATE UNIQUE INDEX "grading_scale_grade_key" ON "grading_scale"("grade");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecturers" ADD CONSTRAINT "lecturers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecturers" ADD CONSTRAINT "lecturers_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dept_admin_profiles" ADD CONSTRAINT "dept_admin_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dept_admin_profiles" ADD CONSTRAINT "dept_admin_profiles_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semesters" ADD CONSTRAINT "semesters_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_allocations" ADD CONSTRAINT "course_allocations_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_allocations" ADD CONSTRAINT "course_allocations_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "lecturers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_allocations" ADD CONSTRAINT "course_allocations_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_allocations" ADD CONSTRAINT "course_allocations_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_courseAllocationId_fkey" FOREIGN KEY ("courseAllocationId") REFERENCES "course_allocations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
