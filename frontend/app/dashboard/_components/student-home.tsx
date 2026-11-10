"use client";

import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { useActivePeriod } from "@/hooks/use-academic-sessions";
import { useMyRegistrations } from "@/hooks/use-registrations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ResultStatusBadge } from "@/components/shared/status-badge";
import type { CurrentUser } from "@/lib/types";
import { InfoCard } from "./home-cards";

export function StudentHome({ user }: { user: CurrentUser }) {
  const student = user.student;
  const { data: activePeriod, isLoading: isPeriodLoading } = useActivePeriod();
  const { data: registrations, isLoading: isRegistrationsLoading } = useMyRegistrations({
    sessionId: activePeriod?.session.id,
    semesterId: activePeriod?.semester.id,
  });
  const isLoading = isPeriodLoading || isRegistrationsLoading;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">Welcome back, {user.firstName}</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard label="Matric Number" value={student?.matricNumber} />
        <InfoCard label="Department" value={student?.department.name} />
        <InfoCard label="Program" value={student?.program.name} />
        <InfoCard label="Level" value={student ? `${student.level} Level` : undefined} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>This semester</CardTitle>
          <CardDescription>
            {registrations ? `${registrations.totalUnits} units registered` : "—"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !registrations || registrations.registrations.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No courses registered yet"
              description="Head to Available Courses to register for the current semester."
              action={
                <Button size="sm" nativeButton={false} render={<Link href="/dashboard/available-courses" />}>
                  Browse courses
                </Button>
              }
            />
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {registrations.registrations.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2 first:pt-0">
                  <span className="font-medium">
                    {r.courseAllocation.course.code} — {r.courseAllocation.course.title}
                  </span>
                  {r.result ? (
                    <ResultStatusBadge status={r.result.status} />
                  ) : (
                    <span className="text-xs text-muted-foreground">Registered</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
