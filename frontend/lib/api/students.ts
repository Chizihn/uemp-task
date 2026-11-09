import { apiClient, unwrap } from "./client";
import type {
  Paginated,
  StudentProfile,
  StudentFilters,
  CreateStudentInput,
  UpdateStudentInput,
} from "@/lib/types";

export type { StudentFilters, CreateStudentInput, UpdateStudentInput };

export function listStudents(filters: StudentFilters) {
  return unwrap(
    apiClient.get<{ success: true; data: Paginated<StudentProfile> }>("/students", {
      params: filters,
    }),
  );
}

export function createStudent(input: CreateStudentInput) {
  return unwrap(apiClient.post<{ success: true; data: StudentProfile }>("/students", input));
}

export function updateStudent(id: string, input: UpdateStudentInput) {
  return unwrap(
    apiClient.patch<{ success: true; data: StudentProfile }>(`/students/${id}`, input),
  );
}
