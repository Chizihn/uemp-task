import { apiClient, unwrap } from "./client";
import type { Faculty, CreateFacultyInput, UpdateFacultyInput } from "@/lib/types";

export type { CreateFacultyInput, UpdateFacultyInput };

export function listFaculties() {
  return unwrap(apiClient.get<{ success: true; data: Faculty[] }>("/faculties"));
}

export function createFaculty(input: CreateFacultyInput) {
  return unwrap(apiClient.post<{ success: true; data: Faculty }>("/faculties", input));
}

export function updateFaculty(id: string, input: UpdateFacultyInput) {
  return unwrap(apiClient.patch<{ success: true; data: Faculty }>(`/faculties/${id}`, input));
}
