"use client";

import { BookOpen, Loader2 } from "lucide-react";
import { useEligibleCourses, useMyRegistrations, useRegisterCourse } from "@/hooks/use-registrations";
import { useActivePeriod } from "@/hooks/use-academic-sessions";
import { useRequireRole } from "@/hooks/use-require-role";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { MAX_UNITS_PER_SEMESTER } from "@/lib/constants";
import { lecturerDisplayName } from "@/lib/utils";
import { TERM_LABEL } from "@/lib/types";

export default function AvailableCoursesPage() {
  const { ready } = useRequireRole("STUDENT");
  const { data: activePeriod } = useActivePeriod();
  const { data: eligible, isLoading } = useEligibleCourses();
  const { data: myRegistrations } = useMyRegistrations({
    sessionId: activePeriod?.session.id,
    semesterId: activePeriod?.semester.id,
  });
  const registerCourse = useRegisterCourse();

  const currentUnits = myRegistrations?.totalUnits ?? 0;
  const remaining = MAX_UNITS_PER_SEMESTER - currentUnits;
  const pct = Math.min(100, (currentUnits / MAX_UNITS_PER_SEMESTER) * 100);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">Available Courses</h1>
        <p className="text-sm text-muted-foreground">
          Courses eligible for your department, level, and the active semester.
        </p>
      </div>

      <Card size="sm">
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Credit load this semester</span>
            <span className="font-medium">
              {currentUnits} / {MAX_UNITS_PER_SEMESTER} units
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={currentUnits}
            aria-valuemin={0}
            aria-valuemax={MAX_UNITS_PER_SEMESTER}
            aria-label="Semester credit unit load"
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
          >
            <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Eligible courses</CardTitle>
          <CardDescription>
            {activePeriod
              ? `${activePeriod.session.name} — ${TERM_LABEL[activePeriod.semester.term]}`
              : "No active semester configured yet"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!ready || isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !eligible || eligible.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No courses available to register for"
              description={
                activePeriod
                  ? "You may have already registered for everything eligible this semester."
                  : "Registration opens once a Super Admin activates an academic session/semester."
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Lecturer</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eligible.map((allocation) => {
                  const wouldExceed = allocation.course.units > remaining;
                  return (
                    <TableRow key={allocation.id}>
                      <TableCell className="font-mono text-xs">
                        {allocation.course.code}
                      </TableCell>
                      <TableCell className="font-medium">{allocation.course.title}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {allocation.course.units}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {lecturerDisplayName(allocation.lecturer)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          disabled={wouldExceed || registerCourse.isPending}
                          title={wouldExceed ? "Would exceed the credit limit this semester" : undefined}
                          onClick={() => registerCourse.mutate(allocation.id)}
                        >
                          {registerCourse.isPending && <Loader2 className="size-4 animate-spin" />}
                          Register
                          <span className="sr-only"> for {allocation.course.code}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
