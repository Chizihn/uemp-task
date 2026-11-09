"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import * as reportsApi from "@/lib/api/reports";
import { reportKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/api/client";

export function useRegistrationSummary(filters: reportsApi.PeriodFilter) {
  return useQuery({
    queryKey: reportKeys.registrationSummary(filters),
    queryFn: () => reportsApi.getRegistrationSummary(filters),
  });
}

export function usePerformanceSummary(filters: reportsApi.PeriodFilter) {
  return useQuery({
    queryKey: reportKeys.performanceSummary(filters),
    queryFn: () => reportsApi.getPerformanceSummary(filters),
  });
}

function downloadBlob({ blob, filename }: reportsApi.ExportedPdf) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function useExportRegistrationSummary() {
  return useMutation({
    mutationFn: reportsApi.exportRegistrationSummary,
    onSuccess: downloadBlob,
    onError: (error) => toast.error(getErrorMessage(error, "Could not generate PDF")),
  });
}

export function useExportPerformanceSummary() {
  return useMutation({
    mutationFn: reportsApi.exportPerformanceSummary,
    onSuccess: downloadBlob,
    onError: (error) => toast.error(getErrorMessage(error, "Could not generate PDF")),
  });
}
