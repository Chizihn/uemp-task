import { apiClient, unwrap } from "./client";
import type { ActivePeriod, AcademicSession, Term } from "@/lib/types";

export function listSessions() {
  return unwrap(
    apiClient.get<{ success: true; data: AcademicSession[] }>("/academic-sessions"),
  );
}

/** Throws (404) if no session/semester has been activated yet — callers should handle that. */
export function getActivePeriod() {
  return unwrap(
    apiClient.get<{ success: true; data: ActivePeriod }>("/academic-sessions/active"),
  );
}

export function createSession(input: { name: string }) {
  return unwrap(
    apiClient.post<{ success: true; data: AcademicSession }>("/academic-sessions", input),
  );
}

export function activateSession(id: string) {
  return unwrap(
    apiClient.patch<{ success: true; data: AcademicSession }>(`/academic-sessions/${id}/activate`),
  );
}

export function addSemester(sessionId: string, input: { term: Term }) {
  return unwrap(
    apiClient.post<{ success: true; data: unknown }>(
      `/academic-sessions/${sessionId}/semesters`,
      input,
    ),
  );
}

export function activateSemester(semesterId: string) {
  return unwrap(
    apiClient.patch<{ success: true; data: unknown }>(
      `/academic-sessions/semesters/${semesterId}/activate`,
    ),
  );
}
