"use client";

import { ShieldCheck } from "lucide-react";
import { useFaculties } from "@/hooks/use-faculties";
import { useDepartments } from "@/hooks/use-departments";
import { useUsers } from "@/hooks/use-users";
import { useAuditLog } from "@/hooks/use-audit-log";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { formatName } from "@/lib/utils";
import type { CurrentUser } from "@/lib/types";
import { StatCard } from "./home-cards";

export function SuperAdminHome({ user }: { user: CurrentUser }) {
  const { data: faculties, isLoading: isFacultiesLoading } = useFaculties();
  const { data: departments, isLoading: isDepartmentsLoading } = useDepartments();
  const { data: students, isLoading: isStudentsLoading } = useUsers({ role: "STUDENT", take: 1 });
  const { data: lecturers, isLoading: isLecturersLoading } = useUsers({ role: "LECTURER", take: 1 });
  const { data: auditLog, isLoading: isAuditLogLoading } = useAuditLog({ take: 5 });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">University overview</h1>
        <p className="text-sm text-muted-foreground">
          {user.firstName} {user.lastName} · {user.email}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Faculties" value={faculties?.length} isLoading={isFacultiesLoading} />
        <StatCard label="Departments" value={departments?.length} isLoading={isDepartmentsLoading} />
        <StatCard label="Students" value={students?.total} isLoading={isStudentsLoading} />
        <StatCard label="Lecturers" value={lecturers?.total} isLoading={isLecturersLoading} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>The latest entries from the system audit log.</CardDescription>
        </CardHeader>
        <CardContent>
          {isAuditLogLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !auditLog || auditLog.items.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="No activity recorded yet" />
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {auditLog.items.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between py-2 first:pt-0">
                  <span className="font-mono text-xs text-muted-foreground">{entry.action}</span>
                  <span className="text-sm">{entry.user ? formatName(entry.user) : "System"}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
