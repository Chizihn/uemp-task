import { apiClient, unwrap } from "./client";
import type { Program, CreateProgramInput, UpdateProgramInput } from "@/lib/types";

export type { CreateProgramInput, UpdateProgramInput };

export function listPrograms(departmentId?: string) {
  return unwrap(
    apiClient.get<{ success: true; data: Program[] }>("/programs", {
      params: { departmentId },
    }),
  );
}

export function createProgram(input: CreateProgramInput) {
  return unwrap(apiClient.post<{ success: true; data: Program }>("/programs", input));
}

export function updateProgram(id: string, input: UpdateProgramInput) {
  return unwrap(apiClient.patch<{ success: true; data: Program }>(`/programs/${id}`, input));
}
