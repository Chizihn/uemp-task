import type { Role, UserStatus } from "@/lib/types/common";
import type { Department, Program } from "@/lib/types/org";

export interface StudentProfile {
  id: string;
  userId: string;
  matricNumber: string;
  departmentId: string;
  programId: string;
  level: number;
  department: Department;
  program: Program;
  /** Present on `GET /students` rows; absent when nested inside `CurrentUser`. */
  user?: { firstName: string; middleName: string | null; lastName: string; email: string; status: UserStatus };
}

export interface LecturerProfile {
  id: string;
  userId: string;
  staffId: string;
  title: string | null;
  departmentId: string;
  department: Department;
  /** Present on `GET /lecturers` rows; absent when nested inside `CurrentUser`. */
  user?: { firstName: string; middleName: string | null; lastName: string; email: string; status: UserStatus };
}

export interface DeptAdminProfile {
  id: string;
  userId: string;
  departmentId: string;
  department: Department;
}

/** Shape of each row from `GET /users` — a narrower projection than `CurrentUser`. */
export interface UserListItem {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  student: { matricNumber: string; department: { name: string } } | null;
  lecturer: { staffId: string; department: { name: string } } | null;
  deptAdminProfile: { department: { name: string } } | null;
}

export interface StudentFilters {
  departmentId?: string;
  programId?: string;
  level?: number;
  status?: UserStatus;
  search?: string;
  skip?: number;
  take?: number;
}

export interface CreateStudentInput {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  password: string;
  matricNumber: string;
  departmentId: string;
  programId: string;
  level: number;
}

export interface UpdateStudentInput {
  matricNumber?: string;
  programId?: string;
  level?: number;
}

export interface LecturerFilters {
  departmentId?: string;
  status?: UserStatus;
  search?: string;
  skip?: number;
  take?: number;
}

export interface CreateLecturerInput {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  password: string;
  staffId: string;
  title?: string;
  departmentId: string;
}

export interface UpdateLecturerInput {
  staffId?: string;
  title?: string;
}

export interface CreateDeptAdminInput {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  password: string;
  departmentId: string;
}

export interface UserFilters {
  role?: Role;
  status?: UserStatus;
  search?: string;
  skip?: number;
  take?: number;
}
