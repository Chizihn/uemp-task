// Mirrors backend/prisma/schema.prisma enums — keep in sync by hand (no shared package yet).

export type Role = "STUDENT" | "LECTURER" | "DEPT_ADMIN" | "SUPER_ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "INACTIVE";
export type Term = "FIRST" | "SECOND" | "THIRD";
export type ResultStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";

/** Every list endpoint returns this envelope. */
export interface Paginated<T> {
  items: T[];
  total: number;
  skip: number;
  take: number;
}

export const TERM_LABEL: Record<Term, string> = {
  FIRST: "First Semester",
  SECOND: "Second Semester",
  THIRD: "Third Semester",
};

export const ROLE_LABEL: Record<Role, string> = {
  STUDENT: "Student",
  LECTURER: "Lecturer",
  DEPT_ADMIN: "Department Admin",
  SUPER_ADMIN: "Super Admin",
};

/** Everyone lands here — the page itself renders different content per role.*/
export const DASHBOARD_HOME = "/dashboard";
