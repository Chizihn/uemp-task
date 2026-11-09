import { apiClient, unwrap } from "./client";
import type { DeptAdminProfile, CreateDeptAdminInput, UpdateDeptAdminInput } from "@/lib/types";

export type { CreateDeptAdminInput, UpdateDeptAdminInput };

export function listDeptAdmins(departmentId?: string) {
  return unwrap(
    apiClient.get<{ success: true; data: DeptAdminProfile[] }>("/dept-admins", {
      params: { departmentId },
    }),
  );
}

export function createDeptAdmin(input: CreateDeptAdminInput) {
  return unwrap(
    apiClient.post<{ success: true; data: DeptAdminProfile }>("/dept-admins", input),
  );
}

export function updateDeptAdmin(id: string, input: UpdateDeptAdminInput) {
  return unwrap(
    apiClient.patch<{ success: true; data: DeptAdminProfile }>(`/dept-admins/${id}`, input),
  );
}
