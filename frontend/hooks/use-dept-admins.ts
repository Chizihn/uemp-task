"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as deptAdminsApi from "@/lib/api/dept-admins";
import { deptAdminKeys, userKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/api/client";

export function useDeptAdmins(departmentId?: string) {
  return useQuery({
    queryKey: deptAdminKeys.list(departmentId),
    queryFn: () => deptAdminsApi.listDeptAdmins(departmentId),
  });
}

export function useCreateDeptAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deptAdminsApi.createDeptAdmin,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: deptAdminKeys.root });
      void queryClient.invalidateQueries({ queryKey: userKeys.root });
      toast.success("Department admin created");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not create department admin")),
  });
}

export function useUpdateDeptAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & deptAdminsApi.UpdateDeptAdminInput) =>
      deptAdminsApi.updateDeptAdmin(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: deptAdminKeys.root });
      void queryClient.invalidateQueries({ queryKey: userKeys.root });
      toast.success("Department admin reassigned");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not reassign department admin")),
  });
}
