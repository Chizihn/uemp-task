import { apiClient, unwrap } from "./client";
import type {
  LecturerProfile,
  Paginated,
  LecturerFilters,
  CreateLecturerInput,
  UpdateLecturerInput,
} from "@/lib/types";

export type { LecturerFilters, CreateLecturerInput, UpdateLecturerInput };

export function listLecturers(filters: LecturerFilters) {
  return unwrap(
    apiClient.get<{ success: true; data: Paginated<LecturerProfile> }>("/lecturers", {
      params: filters,
    }),
  );
}

export function createLecturer(input: CreateLecturerInput) {
  return unwrap(apiClient.post<{ success: true; data: LecturerProfile }>("/lecturers", input));
}

export function updateLecturer(id: string, input: UpdateLecturerInput) {
  return unwrap(
    apiClient.patch<{ success: true; data: LecturerProfile }>(`/lecturers/${id}`, input),
  );
}
