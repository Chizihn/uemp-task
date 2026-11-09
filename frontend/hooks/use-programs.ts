"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as programsApi from "@/lib/api/programs";
import { programKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/api/client";

export function usePrograms(filters: { departmentId?: string } = {}) {
  return useQuery({
    queryKey: programKeys.list(filters),
    queryFn: () => programsApi.listPrograms(filters.departmentId),
  });
}

export function useCreateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: programsApi.createProgram,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: programKeys.root });
      toast.success("Program created");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not create program")),
  });
}

export function useUpdateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & programsApi.UpdateProgramInput) =>
      programsApi.updateProgram(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: programKeys.root });
      toast.success("Program updated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not update program")),
  });
}
