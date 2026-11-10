"use client";

import Link from "next/link";
import { CheckSquare } from "lucide-react";
import { useStudents } from "@/hooks/use-students";
import { useLecturers } from "@/hooks/use-lecturers";
import { usePendingResults } from "@/hooks/use-results";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import type { CurrentUser } from "@/lib/types";
import { StatCard } from "./home-cards";

export function DeptAdminHome({ user }: { user: CurrentUser }) {
  const department = user.deptAdminProfile?.department;
  const { data: students, isLoading: isStudentsLoading } = useStudents({ take: 1 });
  const { data: lecturers, isLoading: isLecturersLoading } = useLecturers({ take: 1 });
  const { data: pending, isLoading: isPendingLoading } = usePendingResults({ take: 5 });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">
          {department?.name ?? "Department"} overview
        </h1>
        <p className="text-sm text-muted-foreground">
          {user.firstName} {user.lastName} · {user.email}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Students" value={students?.total} isLoading={isStudentsLoading} />
        <StatCard label="Lecturers" value={lecturers?.total} isLoading={isLecturersLoading} />
        <StatCard label="Pending approvals" value={pending?.total} isLoading={isPendingLoading} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending result approvals</CardTitle>
          <CardDescription>Submissions awaiting your review appear here.</CardDescription>
        </CardHeader>
        <CardContent>
          {isPendingLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !pending || pending.items.length === 0 ? (
            <EmptyState icon={CheckSquare} title="Nothing pending review" />
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {pending.items.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2 first:pt-0">
                  <span className="font-medium">
                    {r.registration.student.matricNumber} —{" "}
                    {r.registration.courseAllocation.course.code}
                  </span>
                  <span className="text-sm text-muted-foreground">{r.totalScore}</span>
                </li>
              ))}
              {pending.total > pending.items.length && (
                <li className="pt-2">
                  <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/dashboard/approvals" />}>
                    View all {pending.total}
                  </Button>
                </li>
              )}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
