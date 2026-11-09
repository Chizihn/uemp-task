import { apiClient, unwrap } from "./client";
import type { DeptAdminProfile, CreateDeptAdminInput } from "@/lib/types";

export type { CreateDeptAdminInput };

export function createDeptAdmin(input: CreateDeptAdminInput) {
  return unwrap(
    apiClient.post<{ success: true; data: DeptAdminProfile }>("/dept-admins", input),
  );
}
