import { apiClient, unwrap } from "./client";
import type {
  ClassList,
  MyResultsResponse,
  Paginated,
  Result,
  ResultWithRegistration,
  SaveDraftInput,
  PendingResultsFilters,
} from "@/lib/types";

export type { SaveDraftInput, PendingResultsFilters };

export function getClassList(courseAllocationId: string) {
  return unwrap(
    apiClient.get<{ success: true; data: ClassList }>(
      `/results/class-list/${courseAllocationId}`,
    ),
  );
}

export function saveDraft(registrationId: string, input: SaveDraftInput) {
  return unwrap(
    apiClient.patch<{ success: true; data: Result }>(`/results/${registrationId}/draft`, input),
  );
}

export function submitResult(registrationId: string) {
  return unwrap(
    apiClient.post<{ success: true; data: Result }>(`/results/${registrationId}/submit`),
  );
}

export function getMySubmissions() {
  return unwrap(
    apiClient.get<{ success: true; data: ResultWithRegistration[] }>("/results/my-submissions"),
  );
}

export function getPendingResults(filters: PendingResultsFilters) {
  return unwrap(
    apiClient.get<{ success: true; data: Paginated<ResultWithRegistration> }>(
      "/results/pending",
      { params: filters },
    ),
  );
}

export function approveResult(id: string) {
  return unwrap(apiClient.post<{ success: true; data: Result }>(`/results/${id}/approve`));
}

export function rejectResult(id: string, reason: string) {
  return unwrap(
    apiClient.post<{ success: true; data: Result }>(`/results/${id}/reject`, { reason }),
  );
}

export function reopenResult(id: string, reason?: string) {
  return unwrap(
    apiClient.post<{ success: true; data: Result }>(`/results/${id}/reopen`, { reason }),
  );
}

export function getMyResults() {
  return unwrap(
    apiClient.get<{ success: true; data: MyResultsResponse }>("/results/me"),
  );
}
