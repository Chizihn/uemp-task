"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as authApi from "@/lib/api/auth";
import { authKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/api/client";
import { DASHBOARD_HOME } from "@/lib/types";

/** The authenticated user, sourced from the server — this *is* the auth state, not a separate store. */
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: authApi.getMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.me() });
      router.push(DASHBOARD_HOME);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Invalid email or password"));
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear();
      router.push("/login");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not log out"));
    },
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.updateMyProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.me() });
      toast.success("Profile updated");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not update profile"));
    },
  });
}
