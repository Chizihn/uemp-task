import { PrismaClient, Term, ResultStatus, UserStatus, Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { DEFAULT_GRADING_SCALE, resolveGrade } from '../src/common/utils/grade.util';

const prisma = new PrismaClient();

const SEED_PASSWORD = 'Password123!';

async function hash(password: string) {
  return argon2.hash(password, { type: argon2.argon2id });
}

interface UserSpec {
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  role: Role;
  status?: UserStatus;
}

async function upsertUser(passwordHash: string, spec: UserSpec) {
  const data = {
    firstName: spec.firstName,
    middleName: spec.middleName,
    lastName: spec.lastName,
    status: spec.status ?? UserStatus.ACTIVE,
  };
  return prisma.user.upsert({
    where: { email: spec.email },
    update: data,
    create: { email: spec.email, passwordHash, role: spec.role, ...data },
  });
}

async function main() {
  console.log('Seeding grading scale...');
  for (const row of DEFAULT_GRADING_SCALE) {
    await prisma.gradingScale.upsert({ where: { grade: row.grade }, update: row, create: row });
  }
  const passwordHash = await hash(SEED_PASSWORD);

  // ---------------------------------------------------------------------
  // Faculty / departments / programs
  // ---------------------------------------------------------------------
  console.log('Seeding faculty / departments / programs...');
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

  const mth = await prisma.department.upsert({
    where: { code: 'MTH' },
    update: {},
    create: { name: 'Mathematics', code: 'MTH', facultyId: faculty.id },
  });

  const cscProgram = await prisma.program.upsert({
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

  const mthProgram = await prisma.program.upsert({
    where: { code: 'BSC-MTH' },
    update: {},
    create: {
      name: 'B.Sc. Mathematics',
      code: 'BSC-MTH',
      departmentId: mth.id,
      durationYears: 4,
      maxLevel: 400,
    },
  });

  // ---------------------------------------------------------------------
  // Academic calendar — a closed-out past session (fully graded, for GPA/
  // CGPA history) and the live current one.
  // ---------------------------------------------------------------------
  console.log('Seeding academic sessions / semesters...');
  const pastSession = await prisma.academicSession.upsert({
    where: { name: '2023/2024' },
    update: { isActive: false },
    create: { name: '2023/2024', isActive: false },
  });
  const pastFirstSemester = await prisma.semester.upsert({
    where: { sessionId_term: { sessionId: pastSession.id, term: Term.FIRST } },
    update: { isActive: false },
    create: { sessionId: pastSession.id, term: Term.FIRST, isActive: false },
  });
  await prisma.semester.upsert({
    where: { sessionId_term: { sessionId: pastSession.id, term: Term.SECOND } },
    update: { isActive: false },
    create: { sessionId: pastSession.id, term: Term.SECOND, isActive: false },
  });

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
  const secondSemester = await prisma.semester.upsert({
    where: { sessionId_term: { sessionId: session.id, term: Term.SECOND } },
    update: { isActive: false },
    create: { sessionId: session.id, term: Term.SECOND, isActive: false },
  });

  // ---------------------------------------------------------------------
  // Core demo accounts — the ones referenced by every doc / screenshot so
  // far. Emails, passwords, matric/staff IDs stay stable across reseeds.
  // ---------------------------------------------------------------------
  console.log('Seeding core demo accounts...');
  const superAdminUser = await upsertUser(passwordHash, {
    email: 'superadmin@uemp.test',
    firstName: 'Ngozi',
    lastName: 'Adeyemi',
    role: Role.SUPER_ADMIN,
  });

  const deptAdminUser = await upsertUser(passwordHash, {
    email: 'deptadmin@uemp.test',
    firstName: 'Chidi',
    lastName: 'Okafor',
    role: Role.DEPT_ADMIN,
  });
  await prisma.deptAdminProfile.upsert({
    where: { userId: deptAdminUser.id },
    update: {},
    create: { userId: deptAdminUser.id, departmentId: csc.id },
  });

  const mthDeptAdminUser = await upsertUser(passwordHash, {
    email: 'mthdeptadmin@uemp.test',
    firstName: 'Funmilayo',
    lastName: 'Balogun',
    role: Role.DEPT_ADMIN,
  });
  await prisma.deptAdminProfile.upsert({
    where: { userId: mthDeptAdminUser.id },
    update: {},
    create: { userId: mthDeptAdminUser.id, departmentId: mth.id },
  });

  // ---------------------------------------------------------------------
  // Lecturers — CSC gets a full teaching staff (including one suspended,
  // to exercise that state); MTH gets just enough for contrast.
  // ---------------------------------------------------------------------
  console.log('Seeding lecturers...');
  interface LecturerSpec extends UserSpec {
    staffId: string;
    title: string;
    departmentId: string;
  }
  const lecturerSpecs: LecturerSpec[] = [
    {
      email: 'lecturer@uemp.test',
      firstName: 'Tunde',
      lastName: 'Bakare',
      role: Role.LECTURER,
      staffId: 'LEC-001',
      title: 'Dr.',
      departmentId: csc.id,
    },
    {
      email: 'folasade.adeniran@uemp.test',
      firstName: 'Folasade',
      lastName: 'Adeniran',
      role: Role.LECTURER,
      staffId: 'LEC-002',
      title: 'Dr.',
      departmentId: csc.id,
    },
    {
      email: 'emeka.nwosu@uemp.test',
      firstName: 'Emeka',
      lastName: 'Nwosu',
      role: Role.LECTURER,
      staffId: 'LEC-003',
      title: 'Prof.',
      departmentId: csc.id,
    },
    {
      email: 'ibrahim.yusuf@uemp.test',
      firstName: 'Ibrahim',
      lastName: 'Yusuf',
      role: Role.LECTURER,
      staffId: 'LEC-004',
      title: 'Mr.',
      departmentId: csc.id,
      status: UserStatus.SUSPENDED,
    },
    {
      email: 'grace.okonkwo@uemp.test',
      firstName: 'Grace',
      lastName: 'Okonkwo',
      role: Role.LECTURER,
      staffId: 'LEC-005',
      title: 'Dr.',
      departmentId: mth.id,
    },
  ];

  const lecturers = new Map<
    string,
    { id: string; userId: string; staffId: string; departmentId: string }
  >();
  for (const spec of lecturerSpecs) {
    const user = await upsertUser(passwordHash, spec);
    const lecturer = await prisma.lecturer.upsert({
      where: { userId: user.id },
      update: { staffId: spec.staffId, title: spec.title, departmentId: spec.departmentId },
      create: {
        userId: user.id,
        staffId: spec.staffId,
        title: spec.title,
        departmentId: spec.departmentId,
      },
    });
    lecturers.set(spec.staffId, { ...lecturer, userId: user.id });
  }
  const cscLecturers = ['LEC-001', 'LEC-002', 'LEC-003'].map((id) => lecturers.get(id)!);

  // ---------------------------------------------------------------------
  // Students — three per CSC level (100-400) so every level has registered
  // students, plus a small MTH roster for contrast. One suspended, one
  // inactive, to exercise those states in the Students list + audit log.
  // ---------------------------------------------------------------------
  console.log('Seeding students...');
  interface StudentSpec extends UserSpec {
    matricNumber: string;
    level: number;
    departmentId: string;
    programId: string;
  }
  const cscStudentSpecs: StudentSpec[] = [
    // Level 100
    {
      email: 'bola.adewale@uemp.test',
      firstName: 'Bola',
      lastName: 'Adewale',
      role: Role.STUDENT,
      matricNumber: 'CSC/2024/001',
      level: 100,
      departmentId: csc.id,
      programId: cscProgram.id,
    },
    {
      email: 'chinedu.obi@uemp.test',
      firstName: 'Chinedu',
      lastName: 'Obi',
      role: Role.STUDENT,
      matricNumber: 'CSC/2024/002',
      level: 100,
      departmentId: csc.id,
      programId: cscProgram.id,
    },
    {
      email: 'fatima.sani@uemp.test',
      firstName: 'Fatima',
      lastName: 'Sani',
      role: Role.STUDENT,
      matricNumber: 'CSC/2024/003',
      level: 100,
      departmentId: csc.id,
      programId: cscProgram.id,
      status: UserStatus.SUSPENDED,
    },
    // Level 200
    {
      email: 'yemi.alade@uemp.test',
      firstName: 'Yemi',
      lastName: 'Alade',
      role: Role.STUDENT,
      matricNumber: 'CSC/2023/001',
      level: 200,
      departmentId: csc.id,
      programId: cscProgram.id,
    },
    {
      email: 'oluwaseun.fashola@uemp.test',
      firstName: 'Oluwaseun',
      lastName: 'Fashola',
      role: Role.STUDENT,
      matricNumber: 'CSC/2023/002',
      level: 200,
      departmentId: csc.id,
      programId: cscProgram.id,
    },
    {
      email: 'hauwa.bello@uemp.test',
      firstName: 'Hauwa',
      lastName: 'Bello',
      role: Role.STUDENT,
      matricNumber: 'CSC/2023/003',
      level: 200,
      departmentId: csc.id,
      programId: cscProgram.id,
    },
    // Level 300 (Amara is the primary demo account, kept first)
    {
      email: 'student@uemp.test',
      firstName: 'Amara',
      middleName: 'Ifeoma',
      lastName: 'Eze',
      role: Role.STUDENT,
      matricNumber: 'CSC/2021/001',
      level: 300,
      departmentId: csc.id,
      programId: cscProgram.id,
    },
    {
      email: 'segun.ogundimu@uemp.test',
      firstName: 'Segun',
      lastName: 'Ogundimu',
      role: Role.STUDENT,
      matricNumber: 'CSC/2022/001',
      level: 300,
      departmentId: csc.id,
      programId: cscProgram.id,
    },
    {
      email: 'ngozi.chukwu@uemp.test',
      firstName: 'Ngozi',
      lastName: 'Chukwu',
      role: Role.STUDENT,
      matricNumber: 'CSC/2022/002',
      level: 300,
      departmentId: csc.id,
      programId: cscProgram.id,
      status: UserStatus.INACTIVE,
    },
    // Level 400
    {
      email: 'femi.akintola@uemp.test',
      firstName: 'Femi',
      lastName: 'Akintola',
      role: Role.STUDENT,
      matricNumber: 'CSC/2021/002',
      level: 400,
      departmentId: csc.id,
      programId: cscProgram.id,
    },
    {
      email: 'amina.mohammed@uemp.test',
      firstName: 'Amina',
      lastName: 'Mohammed',
      role: Role.STUDENT,
      matricNumber: 'CSC/2021/003',
      level: 400,
      departmentId: csc.id,
      programId: cscProgram.id,
    },
    {
      email: 'david.okoye@uemp.test',
      firstName: 'David',
      lastName: 'Okoye',
      role: Role.STUDENT,
      matricNumber: 'CSC/2021/004',
      level: 400,
      departmentId: csc.id,
      programId: cscProgram.id,
    },
  ];
  const mthStudentSpecs: StudentSpec[] = [
    {
      email: 'blessing.nnamdi@uemp.test',
      firstName: 'Blessing',
      lastName: 'Nnamdi',
      role: Role.STUDENT,
      matricNumber: 'MTH/2024/001',
      level: 100,
      departmentId: mth.id,
      programId: mthProgram.id,
    },
    {
      email: 'kunle.adebayo@uemp.test',
      firstName: 'Kunle',
      lastName: 'Adebayo',
      role: Role.STUDENT,
      matricNumber: 'MTH/2023/001',
      level: 200,
      departmentId: mth.id,
      programId: mthProgram.id,
    },
  ];

  const students = new Map<string, { id: string; level: number }>();
  for (const spec of [...cscStudentSpecs, ...mthStudentSpecs]) {
    const user = await upsertUser(passwordHash, spec);
    const student = await prisma.student.upsert({
      where: { userId: user.id },
      update: {
        matricNumber: spec.matricNumber,
        level: spec.level,
        departmentId: spec.departmentId,
        programId: spec.programId,
      },
      create: {
        userId: user.id,
        matricNumber: spec.matricNumber,
        departmentId: spec.departmentId,
        programId: spec.programId,
        level: spec.level,
      },
    });
    students.set(spec.matricNumber, { id: student.id, level: spec.level });
  }
  const amara = students.get('CSC/2021/001')!;

  function levelRoster(level: number) {
    return cscStudentSpecs
      .filter((s) => s.level === level)
      .map((s) => students.get(s.matricNumber)!);
  }

  // ---------------------------------------------------------------------
  // Courses — spread across every level and both terms, CSC-heavy with a
  // single MTH course for contrast.
  // ---------------------------------------------------------------------
  console.log('Seeding courses...');
  interface CourseSpec {
    code: string;
    title: string;
    units: number;
    level: number;
    term: Term;
    departmentId: string;
  }
  const courseSpecs: CourseSpec[] = [
    {
      code: 'CSC101',
      title: 'Introduction to Programming',
      units: 3,
      level: 100,
      term: Term.FIRST,
      departmentId: csc.id,
    },
    {
      code: 'CSC103',
      title: 'Introduction to Logic Design',
      units: 3,
      level: 100,
      term: Term.FIRST,
      departmentId: csc.id,
    },
    {
      code: 'CSC102',
      title: 'Computer Appreciation',
      units: 2,
      level: 100,
      term: Term.SECOND,
      departmentId: csc.id,
    },
    {
      code: 'CSC201',
      title: 'Data Structures',
      units: 3,
      level: 200,
      term: Term.FIRST,
      departmentId: csc.id,
    },
    {
      code: 'CSC203',
      title: 'Discrete Mathematics',
      units: 3,
      level: 200,
      term: Term.FIRST,
      departmentId: csc.id,
    },
    {
      code: 'CSC202',
      title: 'Digital Logic Design',
      units: 3,
      level: 200,
      term: Term.SECOND,
      departmentId: csc.id,
    },
    {
      code: 'CSC301',
      title: 'Software Engineering',
      units: 3,
      level: 300,
      term: Term.FIRST,
      departmentId: csc.id,
    },
    {
      code: 'CSC302',
      title: 'Database Systems',
      units: 3,
      level: 300,
      term: Term.FIRST,
      departmentId: csc.id,
    },
    {
      code: 'CSC305',
      title: 'Numerical Methods',
      units: 2,
      level: 300,
      term: Term.FIRST,
      departmentId: csc.id,
    },
    {
      code: 'CSC303',
      title: 'Operating Systems',
      units: 3,
      level: 300,
      term: Term.SECOND,
      departmentId: csc.id,
    },
    {
      code: 'CSC304',
      title: 'Computer Networks',
      units: 3,
      level: 300,
      term: Term.SECOND,
      departmentId: csc.id,
    },
    {
      code: 'CSC401',
      title: 'Artificial Intelligence',
      units: 3,
      level: 400,
      term: Term.FIRST,
      departmentId: csc.id,
    },
    {
      code: 'CSC402',
      title: 'Compiler Construction',
      units: 3,
      level: 400,
      term: Term.FIRST,
      departmentId: csc.id,
    },
    {
      code: 'CSC403',
      title: 'Final Year Project',
      units: 6,
      level: 400,
      term: Term.SECOND,
      departmentId: csc.id,
    },
    {
      code: 'MTH101',
      title: 'Calculus I',
      units: 3,
      level: 100,
      term: Term.FIRST,
      departmentId: mth.id,
    },
  ];

  const courses = new Map<
    string,
    { id: string; level: number; term: Term; departmentId: string; units: number }
  >();
  for (const spec of courseSpecs) {
    const course = await prisma.course.upsert({
      where: { code: spec.code },
      update: {
        title: spec.title,
        units: spec.units,
        level: spec.level,
        term: spec.term,
        departmentId: spec.departmentId,
      },
      create: spec,
    });
    courses.set(spec.code, course);
  }

  // ---------------------------------------------------------------------
  // Course allocations — every CSC FIRST-term course gets a lecturer in
  // both the past and current session (so the semester picker on My
  // Courses has real history); SECOND-term courses are allocated for the
  // current (upcoming) semester only.
  // ---------------------------------------------------------------------
  console.log('Seeding course allocations...');
  async function allocate(
    courseCode: string,
    lecturerStaffId: string,
    sessionId: string,
    semesterId: string,
  ) {
    const course = courses.get(courseCode)!;
    const lecturer = lecturers.get(lecturerStaffId)!;
    return prisma.courseAllocation.upsert({
      where: { courseId_sessionId_semesterId: { courseId: course.id, sessionId, semesterId } },
      update: { lecturerId: lecturer.id },
      create: { courseId: course.id, lecturerId: lecturer.id, sessionId, semesterId },
    });
  }

  const firstTermCourses = courseSpecs.filter(
    (c) => c.term === Term.FIRST && c.departmentId === csc.id,
  );
  const secondTermCourses = courseSpecs.filter(
    (c) => c.term === Term.SECOND && c.departmentId === csc.id,
  );

  const currentAllocations = new Map<string, { id: string }>();
  for (const [i, spec] of firstTermCourses.entries()) {
    const lecturerStaffId = cscLecturers[i % cscLecturers.length].staffId;
    currentAllocations.set(
      spec.code,
      await allocate(spec.code, lecturerStaffId, session.id, firstSemester.id),
    );
    await allocate(spec.code, lecturerStaffId, pastSession.id, pastFirstSemester.id);
  }
  for (const [i, spec] of secondTermCourses.entries()) {
    const lecturerStaffId = cscLecturers[i % cscLecturers.length].staffId;
    currentAllocations.set(
      spec.code,
      await allocate(spec.code, lecturerStaffId, session.id, secondSemester.id),
    );
  }
  await allocate('MTH101', 'LEC-005', session.id, firstSemester.id);

  // ---------------------------------------------------------------------
  // Registrations + results for the current active semester (2024/2025,
  // FIRST) — every level registers for its FIRST-term courses, and results
  // are deliberately rotated across every point in the state machine:
  // unregistered-for-grading, draft (partial), draft (ready to submit),
  // submitted, approved, and rejected.
  // ---------------------------------------------------------------------
  console.log('Seeding registrations + results for the current semester...');

  async function register(studentId: string, allocationId: string) {
    return prisma.registration.upsert({
      where: { studentId_courseAllocationId: { studentId, courseAllocationId: allocationId } },
      update: {},
      create: { studentId, courseAllocationId: allocationId },
    });
  }

  async function gradeResult(
    registrationId: string,
    status: ResultStatus,
    scores?: { caScore: number; examScore?: number },
    reviewerId?: string,
    rejectionReason?: string,
  ) {
    let totalScore: number | null = null;
    let grade: string | null = null;
    let gradePoint: number | null = null;
    if (scores && scores.examScore !== undefined) {
      totalScore = scores.caScore + scores.examScore;
      const resolved = resolveGrade(totalScore);
      grade = resolved.grade;
      gradePoint = resolved.gradePoint;
    }
    const base = {
      caScore: scores?.caScore ?? null,
      examScore: scores?.examScore ?? null,
      totalScore,
      grade,
      gradePoint,
      status,
      rejectionReason: rejectionReason ?? null,
      submittedAt: status === ResultStatus.DRAFT ? null : new Date(),
      reviewedAt:
        status === ResultStatus.APPROVED || status === ResultStatus.REJECTED ? new Date() : null,
      reviewedById:
        status === ResultStatus.APPROVED || status === ResultStatus.REJECTED ? reviewerId : null,
    };
    return prisma.result.upsert({
      where: { registrationId },
      update: base,
      create: { registrationId, ...base },
    });
  }

  // One rotation per level: course #1 covers "not yet graded" states,
  // course #2 (and #3, where a level has one) covers "reviewed" states.
  for (const level of [100, 200, 300, 400]) {
    const roster = levelRoster(level);
    const levelCourses = firstTermCourses.filter((c) => c.level === level);

    for (const [courseIndex, courseSpec] of levelCourses.entries()) {
      const allocation = currentAllocations.get(courseSpec.code)!;

      for (const [studentIndex, student] of roster.entries()) {
        const registration = await register(student.id, allocation.id);
        const slot = (courseIndex * roster.length + studentIndex) % 6;

        switch (slot) {
          case 0:
            // Freshly registered, nothing entered yet.
            break;
          case 1:
            await gradeResult(registration.id, ResultStatus.DRAFT, { caScore: 22 });
            break;
          case 2:
            await gradeResult(registration.id, ResultStatus.DRAFT, { caScore: 24, examScore: 55 });
            break;
          case 3:
            await gradeResult(registration.id, ResultStatus.SUBMITTED, {
              caScore: 26,
              examScore: 48,
            });
            break;
          case 4:
            await gradeResult(
              registration.id,
              ResultStatus.APPROVED,
              { caScore: 28, examScore: 52 },
              deptAdminUser.id,
            );
            break;
          case 5:
            await gradeResult(
              registration.id,
              ResultStatus.REJECTED,
              { caScore: 10, examScore: 15 },
              deptAdminUser.id,
              'Exam score looks too low for this student — please recheck the script before resubmitting.',
            );
            break;
        }
      }
    }
  }

  // ---------------------------------------------------------------------
  // A fully-graded past semester (2023/2024, FIRST) for Amara + two
  // classmates, so Results/CGPA has real multi-semester history to show.
  // ---------------------------------------------------------------------
  console.log('Seeding a graded past semester for CGPA history...');
  const pastAllocation301 = await allocate(
    'CSC301',
    'LEC-001',
    pastSession.id,
    pastFirstSemester.id,
  );
  const pastAllocation302 = await allocate(
    'CSC302',
    'LEC-002',
    pastSession.id,
    pastFirstSemester.id,
  );
  for (const student of [amara, ...levelRoster(300).filter((s) => s.id !== amara.id)]) {
    const reg301 = await register(student.id, pastAllocation301.id);
    await gradeResult(
      reg301.id,
      ResultStatus.APPROVED,
      { caScore: 27, examScore: 51 },
      deptAdminUser.id,
    );
    const reg302 = await register(student.id, pastAllocation302.id);
    await gradeResult(
      reg302.id,
      ResultStatus.APPROVED,
      { caScore: 25, examScore: 45 },
      deptAdminUser.id,
    );
  }

  // A lightweight MTH registration, left completely ungraded, so that
  // department stays easy to tell apart from CSC's much busier history.
  const mthAllocation101 = currentAllocations.get('MTH101');
  if (mthAllocation101) {
    for (const spec of mthStudentSpecs) {
      const student = students.get(spec.matricNumber)!;
      await register(student.id, mthAllocation101.id);
    }
  }

  // ---------------------------------------------------------------------
  // Audit log — a plausible slice of history so the Audit Log page isn't
  // empty on first look.
  // ---------------------------------------------------------------------
  console.log('Seeding audit log history...');
  const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000);
  const suspendedStudent = cscStudentSpecs.find((s) => s.status === UserStatus.SUSPENDED)!;
  const suspendedStudentId = students.get(suspendedStudent.matricNumber)!.id;
  await prisma.auditLog.createMany({
    data: [
      {
        userId: deptAdminUser.id,
        action: 'auth.login',
        entityType: 'User',
        entityId: deptAdminUser.id,
        createdAt: hoursAgo(72),
      },
      {
        userId: lecturers.get('LEC-001')!.userId,
        action: 'result.submit',
        entityType: 'Result',
        entityId: null,
        createdAt: hoursAgo(48),
      },
      {
        userId: deptAdminUser.id,
        action: 'result.approve',
        entityType: 'Result',
        entityId: null,
        createdAt: hoursAgo(47),
      },
      {
        userId: deptAdminUser.id,
        action: 'result.reject',
        entityType: 'Result',
        entityId: null,
        metadata: {
          reason:
            'Exam score looks too low for this student — please recheck the script before resubmitting.',
        },
        createdAt: hoursAgo(46),
      },
      {
        userId: superAdminUser.id,
        action: 'user.suspend',
        entityType: 'User',
        entityId: suspendedStudentId,
        metadata: { previousStatus: 'ACTIVE', newStatus: 'SUSPENDED' },
        createdAt: hoursAgo(24),
      },
      {
        userId: superAdminUser.id,
        action: 'auth.login',
        entityType: 'User',
        entityId: superAdminUser.id,
        createdAt: hoursAgo(2),
      },
    ],
    skipDuplicates: true,
  });

  console.log('\nSeed complete. Test credentials (password for all: "%s"):', SEED_PASSWORD);
  console.log(' Super Admin        : superadmin@uemp.test');
  console.log(' Dept Admin  (CSC)  : deptadmin@uemp.test');
  console.log(' Dept Admin  (MTH)  : mthdeptadmin@uemp.test');
  console.log(' Lecturer  (CSC)    : lecturer@uemp.test          — Dr. Tunde Bakare, LEC-001');
  console.log(
    '   + folasade.adeniran@uemp.test, emeka.nwosu@uemp.test, ibrahim.yusuf@uemp.test (suspended)',
  );
  console.log(' Lecturer  (MTH)    : grace.okonkwo@uemp.test');
  console.log(' Student (CSC/300)  : student@uemp.test           — Amara Eze, CSC/2021/001');
  console.log(
    '   + 11 more CSC students spread across levels 100-400 (one suspended, one inactive)',
  );
  console.log('   + 2 MTH students for cross-department contrast');
  console.log(' 15 courses (CSC: 14 across every level/term, MTH: 1), 2 academic sessions');
  console.log(
    ' Every Result state covered: none yet, draft (partial), draft (ready), submitted, approved, rejected',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
