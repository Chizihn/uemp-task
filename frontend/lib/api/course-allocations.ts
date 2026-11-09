import { apiClient, unwrap } from "./client";
import type {
  CourseAllocation,
  Paginated,
  AllocationFilters,
  CreateAllocationInput,
} from "@/lib/types";

export type { AllocationFilters, CreateAllocationInput };

export function listAllocations(filters: AllocationFilters) {
  return unwrap(
    apiClient.get<{ success: true; data: Paginated<CourseAllocation> }>("/course-allocations", {
      params: filters,
    }),
  );
}

export function createAllocation(input: CreateAllocationInput) {
  return unwrap(
    apiClient.post<{ success: true; data: CourseAllocation }>("/course-allocations", input),
  );
}

export function updateAllocation(id: string, lecturerId: string) {
  return unwrap(
    apiClient.patch<{ success: true; data: CourseAllocation }>(`/course-allocations/${id}`, {
      lecturerId,
    }),
  );
}
