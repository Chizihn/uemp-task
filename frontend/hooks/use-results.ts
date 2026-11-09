"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as resultsApi from "@/lib/api/results";
import { resultKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/api/client";

export function useClassList(courseAllocationId: string | undefined) {
  return useQuery({
    queryKey: resultKeys.classList(courseAllocationId ?? ""),
    queryFn: () => resultsApi.getClassList(courseAllocationId!),
    enabled: !!courseAllocationId,
  });
}

export function useMySubmissions() {
  return useQuery({
    queryKey: resultKeys.mySubmissions(),
    queryFn: resultsApi.getMySubmissions,
  });
}

export function usePendingResults(filters: resultsApi.PendingResultsFilters) {
  return useQuery({
    queryKey: resultKeys.pending(filters),
    queryFn: () => resultsApi.getPendingResults(filters),
  });
}

export function useMyResults() {
  return useQuery({
    queryKey: resultKeys.mine(),
    queryFn: resultsApi.getMyResults,
  });
}

export function useSaveDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ registrationId, ...input }: { registrationId: string } & resultsApi.SaveDraftInput) =>
      resultsApi.saveDraft(registrationId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: resultKeys.root });
      toast.success("Draft saved");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not save draft")),
  });
}

export function useSubmitResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resultsApi.submitResult,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: resultKeys.root });
      toast.success("Result submitted for review");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not submit result")),
  });
}

export function useApproveResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resultsApi.approveResult,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: resultKeys.root });
      toast.success("Result approved and published");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not approve result")),
  });
}

export function useRejectResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      resultsApi.rejectResult(id, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: resultKeys.root });
      toast.success("Result returned to lecturer for correction");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not reject result")),
  });
}

export function useReopenResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      resultsApi.reopenResult(id, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: resultKeys.root });
      toast.success("Result reopened for correction");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not reopen result")),
  });
}
