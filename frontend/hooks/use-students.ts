"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as studentsApi from "@/lib/api/students";
import { studentKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/api/client";

export function useStudents(filters: studentsApi.StudentFilters) {
  return useQuery({
    queryKey: studentKeys.list(filters),
    queryFn: () => studentsApi.listStudents(filters),
    placeholderData: keepPreviousData,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: studentsApi.createStudent,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: studentKeys.root });
      toast.success("Student registered");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not register student")),
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & studentsApi.UpdateStudentInput) =>
      studentsApi.updateStudent(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: studentKeys.root });
      toast.success("Student updated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not update student")),
  });
}
