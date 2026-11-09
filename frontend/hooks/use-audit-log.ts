"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import * as auditLogApi from "@/lib/api/audit-log";
import { auditLogKeys } from "@/lib/query-keys";

export function useAuditLog(filters: auditLogApi.AuditLogFilters) {
  return useQuery({
    queryKey: auditLogKeys.list(filters),
    queryFn: () => auditLogApi.listAuditLog(filters),
    placeholderData: keepPreviousData,
  });
}
