/** Faculty / Department / Program — the structural hierarchy everything else hangs off. */

export interface Faculty {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  facultyId: string;
  isActive: boolean;
  faculty?: Faculty;
}

export interface Program {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  durationYears: number;
  maxLevel: number;
  isActive: boolean;
}

export interface CreateFacultyInput {
  name: string;
  code: string;
}

export interface UpdateFacultyInput {
  name?: string;
  code?: string;
  isActive?: boolean;
}

export interface CreateDepartmentInput {
  name: string;
  code: string;
  facultyId: string;
}

export interface UpdateDepartmentInput {
  name?: string;
  code?: string;
  facultyId?: string;
  isActive?: boolean;
}

export interface CreateProgramInput {
  name: string;
  code: string;
  departmentId: string;
  durationYears: number;
  maxLevel: number;
}

export interface UpdateProgramInput {
  name?: string;
  code?: string;
  departmentId?: string;
  durationYears?: number;
  maxLevel?: number;
  isActive?: boolean;
}
