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

/** `fallback` filename in case the server ever omits Content-Disposition. */
function filenameFromDisposition(header: string | undefined, fallback: string): string {
  const match = header?.match(/filename="?([^"]+)"?/);
  return match?.[1] ?? fallback;
}

export interface ExportedPdf {
  blob: Blob;
  filename: string;
}

async function exportPdf(path: string, filters: PeriodFilter, fallback: string): Promise<ExportedPdf> {
  const response = await apiClient.post<Blob>(path, null, {
    params: filters,
    responseType: "blob",
  });
  return {
    blob: response.data,
    filename: filenameFromDisposition(response.headers["content-disposition"], fallback),
  };
}

export function exportRegistrationSummary(filters: PeriodFilter) {
  return exportPdf("/reports/registration-summary/export", filters, "registration-summary.pdf");
}

export function exportPerformanceSummary(filters: PeriodFilter) {
  return exportPdf("/reports/performance-summary/export", filters, "performance-summary.pdf");
}
