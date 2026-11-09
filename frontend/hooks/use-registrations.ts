"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as registrationsApi from "@/lib/api/registrations";
import { registrationKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/api/client";

export function useEligibleCourses() {
  return useQuery({
    queryKey: registrationKeys.eligible(),
    queryFn: registrationsApi.listEligibleCourses,
  });
}

export function useMyRegistrations(filters: registrationsApi.MyRegistrationsFilter) {
  return useQuery({
    queryKey: registrationKeys.mine(filters),
    queryFn: () => registrationsApi.getMyRegistrations(filters),
  });
}

export function useRegisterCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registrationsApi.registerCourse,
    onSuccess: () => {
      // Registering changes both "what's left to register for" and "what I'm registered for".
      void queryClient.invalidateQueries({ queryKey: registrationKeys.root });
      toast.success("Registered for course");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not register for this course")),
  });
}

export function useWithdrawRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registrationsApi.withdrawRegistration,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: registrationKeys.root });
      toast.success("Withdrawn from course");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not withdraw from this course")),
  });
}
