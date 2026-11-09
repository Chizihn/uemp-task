import { apiClient, unwrap } from "./client";
import type { PeriodFilter, RegistrationSummaryRow, PerformanceSummaryRow } from "@/lib/types";

export type { PeriodFilter, RegistrationSummaryRow, PerformanceSummaryRow };

export function getRegistrationSummary(filters: PeriodFilter) {
  return unwrap(
    apiClient.get<{ success: true; data: RegistrationSummaryRow[] }>(
      "/reports/registration-summary",
      { params: filters },
    ),
  );
}

export function getPerformanceSummary(filters: PeriodFilter) {
  return unwrap(
    apiClient.get<{ success: true; data: PerformanceSummaryRow[] }>(
      "/reports/performance-summary",
      { params: filters },
    ),
  );
}
