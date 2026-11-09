import type { Course, CourseAllocation } from "@/lib/types/course";
import type { Result } from "@/lib/types/result";

export interface Registration {
  id: string;
  studentId: string;
  courseAllocationId: string;
  registeredAt: string;
  courseAllocation: CourseAllocation;
  result?: Result | null;
}

/** A registration row as returned by the class-list / pending-results endpoints — includes the student. */
export interface RegistrationWithStudent extends Registration {
  student: {
    id: string;
    matricNumber: string;
    user: { firstName: string; middleName: string | null; lastName: string; email: string };
  };
}

/** Shape of `GET /results/class-list/:courseAllocationId`. */
export interface ClassList {
  allocation: {
    id: string;
    courseId: string;
    lecturerId: string;
    sessionId: string;
    semesterId: string;
    course: Course;
  };
  registrations: (RegistrationWithStudent & { result: Result | null })[];
}

export interface MyRegistrationsFilter {
  sessionId?: string;
  semesterId?: string;
}

export interface MyRegistrationsResult {
  registrations: Registration[];
  totalUnits: number;
}
