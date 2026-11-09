"use client";

import { useRequireAuth } from "@/hooks/use-require-role";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { FullPageSpinner } from "@/components/shared/full-page-spinner";
import { NAV_BY_ROLE } from "@/lib/nav";

export function DashboardClientLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useRequireAuth();

  if (!ready || !user) {
    return <FullPageSpinner />;
  }

  return (
    <DashboardShell nav={NAV_BY_ROLE[user.role]} user={user}>
      {children}
    </DashboardShell>
  );
}
