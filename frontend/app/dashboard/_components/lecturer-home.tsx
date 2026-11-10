"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { useActivePeriod } from "@/hooks/use-academic-sessions";
import { useCourseAllocations } from "@/hooks/use-course-allocations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import type { CurrentUser } from "@/lib/types";
import { InfoCard } from "./home-cards";

export function LecturerHome({ user }: { user: CurrentUser }) {
  const lecturer = user.lecturer;
  const { data: activePeriod, isLoading: isPeriodLoading } = useActivePeriod();
  const { data: allocations, isLoading: isAllocationsLoading } = useCourseAllocations({
    sessionId: activePeriod?.session.id,
    semesterId: activePeriod?.semester.id,
  });
  const isLoading = isPeriodLoading || isAllocationsLoading;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">
          Welcome back, {lecturer?.title ? `${lecturer.title} ` : ""}
          {user.firstName}
        </h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <InfoCard label="Staff ID" value={lecturer?.staffId} />
        <InfoCard label="Department" value={lecturer?.department.name} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned courses</CardTitle>
          <CardDescription>
            Courses allocated to you for the active session appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !allocations || allocations.items.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No courses assigned yet"
              description="Once a Department Admin allocates a course to you, it'll show up here."
            />
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {allocations.items.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2 first:pt-0">
                  <span className="font-medium">
                    {a.course.code} — {a.course.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    nativeButton={false}
                    render={<Link href={`/dashboard/my-courses/${a.id}`} />}
                  >
                    Class list
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
