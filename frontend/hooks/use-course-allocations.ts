"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as allocationsApi from "@/lib/api/course-allocations";
import { allocationKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/api/client";

export function useCourseAllocations(filters: allocationsApi.AllocationFilters) {
  return useQuery({
    queryKey: allocationKeys.list(filters),
    queryFn: () => allocationsApi.listAllocations(filters),
    enabled: !!filters.sessionId && !!filters.semesterId,
  });
}

export function useCreateAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: allocationsApi.createAllocation,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: allocationKeys.root });
      toast.success("Lecturer assigned");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not assign lecturer")),
  });
}

export function useUpdateAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, lecturerId }: { id: string; lecturerId: string }) =>
      allocationsApi.updateAllocation(id, lecturerId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: allocationKeys.root });
      toast.success("Lecturer reassigned");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not reassign lecturer")),
  });
}
