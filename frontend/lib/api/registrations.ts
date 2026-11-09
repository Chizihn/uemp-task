import { apiClient, unwrap } from "./client";
import type {
  CourseAllocation,
  Registration,
  MyRegistrationsFilter,
  MyRegistrationsResult,
} from "@/lib/types";

export type { MyRegistrationsFilter, MyRegistrationsResult };

export function listEligibleCourses() {
  return unwrap(
    apiClient.get<{ success: true; data: CourseAllocation[] }>("/registrations/eligible-courses"),
  );
}

export function getMyRegistrations(filters: MyRegistrationsFilter) {
  return unwrap(
    apiClient.get<{ success: true; data: MyRegistrationsResult }>("/registrations/me", {
      params: filters,
    }),
  );
}

export function registerCourse(courseAllocationId: string) {
  return unwrap(
    apiClient.post<{ success: true; data: Registration }>("/registrations", {
      courseAllocationId,
    }),
  );
}

export function withdrawRegistration(id: string) {
  return unwrap(
    apiClient.delete<{ success: true; data: { success: true } }>(`/registrations/${id}`),
  );
}
