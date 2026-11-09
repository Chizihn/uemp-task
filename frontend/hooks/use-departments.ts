"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as departmentsApi from "@/lib/api/departments";
import { departmentKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/api/client";

export function useDepartments(filters: { facultyId?: string } = {}) {
  return useQuery({
    queryKey: departmentKeys.list(filters),
    queryFn: () => departmentsApi.listDepartments(filters.facultyId),
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: departmentsApi.createDepartment,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: departmentKeys.root });
      toast.success("Department created");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not create department")),
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & departmentsApi.UpdateDepartmentInput) =>
      departmentsApi.updateDepartment(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: departmentKeys.root });
      toast.success("Department updated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not update department")),
  });
}
