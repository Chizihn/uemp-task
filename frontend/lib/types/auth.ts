import type { Role, UserStatus } from "@/lib/types/common";
import type { StudentProfile, LecturerProfile, DeptAdminProfile } from "@/lib/types/people";

/** Shape of `GET /auth/me`. */
export interface CurrentUser {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string;
  role: Role;
  status: UserStatus;
  avatarUrl: string | null;
  phone?: string | null;
  createdAt: string;
  student: StudentProfile | null;
  lecturer: LecturerProfile | null;
  deptAdminProfile: DeptAdminProfile | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  user: { id: string; email: string; role: Role };
}

export interface UpdateMyProfileInput {
  phone?: string;
  avatarUrl?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}
