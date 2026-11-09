"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as lecturersApi from "@/lib/api/lecturers";
import { lecturerKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/api/client";

export function useLecturers(filters: lecturersApi.LecturerFilters) {
  return useQuery({
    queryKey: lecturerKeys.list(filters),
    queryFn: () => lecturersApi.listLecturers(filters),
    placeholderData: keepPreviousData,
  });
}

export function useCreateLecturer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: lecturersApi.createLecturer,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: lecturerKeys.root });
      toast.success("Lecturer created");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not create lecturer")),
  });
}

export function useUpdateLecturer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & lecturersApi.UpdateLecturerInput) =>
      lecturersApi.updateLecturer(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: lecturerKeys.root });
      toast.success("Lecturer updated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not update lecturer")),
  });
}
