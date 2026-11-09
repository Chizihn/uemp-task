import { PrismaClient, Term, ResultStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { DEFAULT_GRADING_SCALE, resolveGrade } from '../src/common/utils/grade.util';

const prisma = new PrismaClient();

const SEED_PASSWORD = 'Password123!';

async function hash(password: string) {
  return argon2.hash(password, { type: argon2.argon2id });
}

async function main() {
  console.log('Seeding grading scale...');
  for (const row of DEFAULT_GRADING_SCALE) {
    await prisma.gradingScale.upsert({
      where: { grade: row.grade },
      update: row,
      create: row,
    });
  }

  console.log('Seeding faculty / department / program...');
  const faculty = await prisma.faculty.upsert({
    where: { code: 'FOS' },
    update: {},
    create: { name: 'Faculty of Science', code: 'FOS' },
  });

  const csc = await prisma.department.upsert({
    where: { code: 'CSC' },
    update: {},
    create: { name: 'Computer Science', code: 'CSC', facultyId: faculty.id },
  });

  const program = await prisma.program.upsert({
    where: { code: 'BSC-CSC' },
    update: {},
    create: {
      name: 'B.Sc. Computer Science',
      code: 'BSC-CSC',
      departmentId: csc.id,
      durationYears: 4,
      maxLevel: 400,
    },
  });

  console.log('Seeding academic session / semesters...');
  const session = await prisma.academicSession.upsert({
    where: { name: '2024/2025' },
    update: { isActive: true },
    create: { name: '2024/2025', isActive: true },
  });

  const firstSemester = await prisma.semester.upsert({
    where: { sessionId_term: { sessionId: session.id, term: Term.FIRST } },
    update: { isActive: true },
    create: { sessionId: session.id, term: Term.FIRST, isActive: true },
  });

  await prisma.semester.upsert({
    where: { sessionId_term: { sessionId: session.id, term: Term.SECOND } },
    update: { isActive: false },
    create: { sessionId: session.id, term: Term.SECOND, isActive: false },
  });

  console.log('Seeding users...');
  const passwordHash = await hash(SEED_PASSWORD);

  const superAdminUser = await prisma.user.upsert({
    where: { email: 'superadmin@uemp.test' },
    update: { firstName: 'Ngozi', lastName: 'Adeyemi' },
    create: {
      email: 'superadmin@uemp.test',
      passwordHash,
      role: 'SUPER_ADMIN',
      firstName: 'Ngozi',
      lastName: 'Adeyemi',
    },
  });

  const deptAdminUser = await prisma.user.upsert({
    where: { email: 'deptadmin@uemp.test' },
    update: { firstName: 'Chidi', lastName: 'Okafor' },
    create: {
      email: 'deptadmin@uemp.test',
      passwordHash,
      role: 'DEPT_ADMIN',
      firstName: 'Chidi',
      lastName: 'Okafor',
    },
  });
  await prisma.deptAdminProfile.upsert({
    where: { userId: deptAdminUser.id },
    update: {},
    create: { userId: deptAdminUser.id, departmentId: csc.id },
  });

  const lecturerUser = await prisma.user.upsert({
    where: { email: 'lecturer@uemp.test' },
    update: { firstName: 'Tunde', lastName: 'Bakare' },
    create: {
      email: 'lecturer@uemp.test',
      passwordHash,
      role: 'LECTURER',
      firstName: 'Tunde',
      lastName: 'Bakare',
    },
  });
  const lecturer = await prisma.lecturer.upsert({
    where: { userId: lecturerUser.id },
    update: {},
    create: {
      userId: lecturerUser.id,
      staffId: 'LEC-001',
      title: 'Dr.',
      departmentId: csc.id,
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: 'student@uemp.test' },
    update: { firstName: 'Amara', middleName: 'Ifeoma', lastName: 'Eze' },
    create: {
      email: 'student@uemp.test',
      passwordHash,
      role: 'STUDENT',
      firstName: 'Amara',
      middleName: 'Ifeoma',
      lastName: 'Eze',
    },
  });
  const student = await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      matricNumber: 'CSC/2021/001',
      departmentId: csc.id,
      programId: program.id,
      level: 300,
    },
  });

  console.log('Seeding courses...');
  const course301 = await prisma.course.upsert({
    where: { code: 'CSC301' },
    update: {},
    create: {
      code: 'CSC301',
      title: 'Software Engineering',
      units: 3,
      level: 300,
      term: Term.FIRST,
      departmentId: csc.id,
    },
  });

  const course302 = await prisma.course.upsert({
    where: { code: 'CSC302' },
    update: {},
    create: {
      code: 'CSC302',
      title: 'Database Systems',
      units: 3,
      level: 300,
      term: Term.FIRST,
      departmentId: csc.id,
    },
  });

  console.log('Seeding course allocations...');
  const allocation301 = await prisma.courseAllocation.upsert({
    where: { courseId_sessionId_semesterId: { courseId: course301.id, sessionId: session.id, semesterId: firstSemester.id } },
    update: {},
    create: {
      courseId: course301.id,
      lecturerId: lecturer.id,
      sessionId: session.id,
      semesterId: firstSemester.id,
    },
  });

  const allocation302 = await prisma.courseAllocation.upsert({
    where: { courseId_sessionId_semesterId: { courseId: course302.id, sessionId: session.id, semesterId: firstSemester.id } },
    update: {},
    create: {
      courseId: course302.id,
      lecturerId: lecturer.id,
      sessionId: session.id,
      semesterId: firstSemester.id,
    },
  });

  console.log('Seeding registrations + sample results...');
  const registration301 = await prisma.registration.upsert({
    where: { studentId_courseAllocationId: { studentId: student.id, courseAllocationId: allocation301.id } },
    update: {},
    create: { studentId: student.id, courseAllocationId: allocation301.id },
  });

  const registration302 = await prisma.registration.upsert({
    where: { studentId_courseAllocationId: { studentId: student.id, courseAllocationId: allocation302.id } },
    update: {},
    create: { studentId: student.id, courseAllocationId: allocation302.id },
  });

  // CSC301: already reviewed and approved -> visible to the student, counts toward CGPA.
  const approvedTotal = 78;
  const approvedGrade = resolveGrade(approvedTotal);
  await prisma.result.upsert({
    where: { registrationId: registration301.id },
    update: {},
    create: {
      registrationId: registration301.id,
      caScore: 28,
      examScore: 50,
      totalScore: approvedTotal,
      grade: approvedGrade.grade,
      gradePoint: approvedGrade.gradePoint,
      status: ResultStatus.APPROVED,
      submittedAt: new Date(),
      reviewedAt: new Date(),
      reviewedById: deptAdminUser.id,
    },
  });

  // CSC302: submitted by the lecturer, sitting in the Dept Admin's approval queue.
  const submittedTotal = 65;
  const submittedGrade = resolveGrade(submittedTotal);
  await prisma.result.upsert({
    where: { registrationId: registration302.id },
    update: {},
    create: {
      registrationId: registration302.id,
      caScore: 25,
      examScore: 40,
      totalScore: submittedTotal,
      grade: submittedGrade.grade,
      gradePoint: submittedGrade.gradePoint,
      status: ResultStatus.SUBMITTED,
      submittedAt: new Date(),
    },
  });

  console.log('\nSeed complete. Test credentials (password for all: "%s"):', SEED_PASSWORD);
  console.log(' Super Admin : superadmin@uemp.test');
  console.log(' Dept Admin  : deptadmin@uemp.test  (Computer Science)');
  console.log(' Lecturer    : lecturer@uemp.test   (CSC301, CSC302)');
  console.log(' Student     : student@uemp.test    (CSC/2021/001)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
