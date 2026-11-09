"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as deptAdminsApi from "@/lib/api/dept-admins";
import { userKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/api/client";

export function useCreateDeptAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deptAdminsApi.createDeptAdmin,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.root });
      toast.success("Department admin created");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not create department admin")),
  });
}
