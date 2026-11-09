import type { Term } from "@/lib/types/common";
import type { Department } from "@/lib/types/org";
import type { LecturerProfile } from "@/lib/types/people";
import type { AcademicSession, Semester } from "@/lib/types/academic-period";

export interface Course {
  id: string;
  code: string;
  title: string;
  units: number;
  level: number;
  term: Term;
  departmentId: string;
  isActive: boolean;
  department?: Department;
}

export interface CourseAllocation {
  id: string;
  courseId: string;
  lecturerId: string;
  sessionId: string;
  semesterId: string;
  course: Course;
  lecturer: LecturerProfile;
  session: Omit<AcademicSession, "semesters">;
  semester: Semester;
}

export interface CourseFilters {
  departmentId?: string;
  level?: number;
  term?: Term;
  search?: string;
  skip?: number;
  take?: number;
}

export interface CreateCourseInput {
  code: string;
  title: string;
  units: number;
  level: number;
  term: Term;
  departmentId: string;
}

export interface UpdateCourseInput {
  code?: string;
  title?: string;
  units?: number;
  level?: number;
  term?: Term;
  isActive?: boolean;
}

export interface AllocationFilters {
  sessionId?: string;
  semesterId?: string;
  courseId?: string;
  lecturerId?: string;
  search?: string;
  skip?: number;
  take?: number;
}

export interface CreateAllocationInput {
  courseId: string;
  lecturerId: string;
  sessionId: string;
  semesterId: string;
}
