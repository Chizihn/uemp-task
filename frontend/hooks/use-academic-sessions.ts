"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as sessionsApi from "@/lib/api/academic-sessions";
import { academicSessionKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/api/client";
import type { Term } from "@/lib/types";

export function useAcademicSessions() {
  return useQuery({
    queryKey: academicSessionKeys.list(),
    queryFn: sessionsApi.listSessions,
  });
}

/** 404s (no active period configured yet) resolve as `data: undefined`, not an error toast. */
export function useActivePeriod() {
  return useQuery({
    queryKey: [...academicSessionKeys.root, "active"],
    queryFn: sessionsApi.getActivePeriod,
    retry: false,
    throwOnError: false,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sessionsApi.createSession,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: academicSessionKeys.root });
      toast.success("Academic session created");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not create session")),
  });
}

export function useActivateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sessionsApi.activateSession,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: academicSessionKeys.root });
      toast.success("Session activated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not activate session")),
  });
}

export function useAddSemester() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, term }: { sessionId: string; term: Term }) =>
      sessionsApi.addSemester(sessionId, { term }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: academicSessionKeys.root });
      toast.success("Semester added");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not add semester")),
  });
}

export function useActivateSemester() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sessionsApi.activateSemester,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: academicSessionKeys.root });
      toast.success("Semester activated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not activate semester")),
  });
}
