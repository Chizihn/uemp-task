import { apiClient, unwrap } from "./client";
import type { AuditLogEntry, Paginated, AuditLogFilters } from "@/lib/types";

export type { AuditLogFilters };

export function listAuditLog(filters: AuditLogFilters) {
  return unwrap(
    apiClient.get<{ success: true; data: Paginated<AuditLogEntry> }>("/audit-log", {
      params: filters,
    }),
  );
}
