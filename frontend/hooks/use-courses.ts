"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as coursesApi from "@/lib/api/courses";
import { courseKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/api/client";

export function useCourses(filters: coursesApi.CourseFilters) {
  return useQuery({
    queryKey: courseKeys.list(filters),
    queryFn: () => coursesApi.listCourses(filters),
    placeholderData: keepPreviousData,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: coursesApi.createCourse,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: courseKeys.root });
      toast.success("Course created");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not create course")),
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & coursesApi.UpdateCourseInput) =>
      coursesApi.updateCourse(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: courseKeys.root });
      toast.success("Course updated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not update course")),
  });
}
