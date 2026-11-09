import { apiClient, unwrap } from "./client";
import type { Department, CreateDepartmentInput, UpdateDepartmentInput } from "@/lib/types";

export type { CreateDepartmentInput, UpdateDepartmentInput };

export function listDepartments(facultyId?: string) {
  return unwrap(
    apiClient.get<{ success: true; data: Department[] }>("/departments", {
      params: { facultyId },
    }),
  );
}

export function createDepartment(input: CreateDepartmentInput) {
  return unwrap(apiClient.post<{ success: true; data: Department }>("/departments", input));
}

export function updateDepartment(id: string, input: UpdateDepartmentInput) {
  return unwrap(
    apiClient.patch<{ success: true; data: Department }>(`/departments/${id}`, input),
  );
}
