"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as usersApi from "@/lib/api/users";
import { userKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/api/client";
import type { UserStatus } from "@/lib/types";

export function useUsers(filters: usersApi.UserFilters) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => usersApi.listUsers(filters),
    placeholderData: keepPreviousData,
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) =>
      usersApi.updateUserStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.root });
      toast.success("User status updated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not update user status")),
  });
}
