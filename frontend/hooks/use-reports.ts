"use client";

import { useQuery } from "@tanstack/react-query";
import * as reportsApi from "@/lib/api/reports";
import { reportKeys } from "@/lib/query-keys";

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
