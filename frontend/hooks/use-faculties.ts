"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as facultiesApi from "@/lib/api/faculties";
import { facultyKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/api/client";

export function useFaculties() {
  return useQuery({
    queryKey: facultyKeys.list(),
    queryFn: facultiesApi.listFaculties,
  });
}

export function useCreateFaculty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: facultiesApi.createFaculty,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: facultyKeys.root });
      toast.success("Faculty created");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not create faculty")),
  });
}

export function useUpdateFaculty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & facultiesApi.UpdateFacultyInput) =>
      facultiesApi.updateFaculty(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: facultyKeys.root });
      toast.success("Faculty updated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not update faculty")),
  });
}
