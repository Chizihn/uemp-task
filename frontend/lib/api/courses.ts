import { apiClient, unwrap } from "./client";
import type {
  Course,
  Paginated,
  CourseFilters,
  CreateCourseInput,
  UpdateCourseInput,
} from "@/lib/types";

export type { CourseFilters, CreateCourseInput, UpdateCourseInput };

export function listCourses(filters: CourseFilters) {
  return unwrap(
    apiClient.get<{ success: true; data: Paginated<Course> }>("/courses", { params: filters }),
  );
}

export function createCourse(input: CreateCourseInput) {
  return unwrap(apiClient.post<{ success: true; data: Course }>("/courses", input));
}

export function updateCourse(id: string, input: UpdateCourseInput) {
  return unwrap(apiClient.patch<{ success: true; data: Course }>(`/courses/${id}`, input));
}
