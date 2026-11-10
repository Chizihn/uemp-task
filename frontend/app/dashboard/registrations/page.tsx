"use client";

import { useState } from "react";
import { ClipboardList, Printer, X } from "lucide-react";
import { useMyRegistrations, useWithdrawRegistration } from "@/hooks/use-registrations";
import { useActivePeriod } from "@/hooks/use-academic-sessions";
import { useRequireRole } from "@/hooks/use-require-role";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ResultStatusBadge } from "@/components/shared/status-badge";
import { TERM_LABEL, type Registration } from "@/lib/types";
import { formatName, lecturerDisplayName } from "@/lib/utils";

export default function RegistrationsPage() {
  const { ready, user } = useRequireRole("STUDENT");
  const { data: activePeriod } = useActivePeriod();
  const { data, isLoading } = useMyRegistrations({
    sessionId: activePeriod?.session.id,
    semesterId: activePeriod?.semester.id,
  });
  const withdraw = useWithdrawRegistration();
  const [withdrawing, setWithdrawing] = useState<Registration | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="font-heading text-2xl font-medium">My Registrations</h1>
          <p className="text-sm text-muted-foreground">
            Courses registered for the current semester.
          </p>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="size-4" /> Print summary
        </Button>
      </div>

      <div className="hidden flex-col gap-1 print:flex">
        <h1 className="font-heading text-xl font-medium">Course Registration Summary</h1>
        <p className="text-sm text-muted-foreground">
          {user ? formatName(user) : ""} — {user?.student?.matricNumber} —{" "}
          {activePeriod
            ? `${activePeriod.session.name}, ${TERM_LABEL[activePeriod.semester.term]}`
            : ""}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {activePeriod
              ? `${activePeriod.session.name} — ${TERM_LABEL[activePeriod.semester.term]}`
              : "No active semester"}
          </CardTitle>
          <CardDescription>{data?.totalUnits ?? 0} total units registered</CardDescription>
        </CardHeader>
        <CardContent>
          {!ready || isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !data || data.registrations.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No courses registered yet"
              description="Head to Available Courses to register for the current semester."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Lecturer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right print:hidden">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.registrations.map((registration) => {
                  const course = registration.courseAllocation.course;
                  const lecturer = registration.courseAllocation.lecturer;
                  return (
                    <TableRow key={registration.id}>
                      <TableCell className="font-mono text-xs">{course.code}</TableCell>
                      <TableCell className="font-medium">{course.title}</TableCell>
                      <TableCell className="text-muted-foreground">{course.units}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {lecturerDisplayName(lecturer)}
                      </TableCell>
                      <TableCell>
                        {registration.result ? (
                          <ResultStatusBadge status={registration.result.status} />
                        ) : (
                          <Badge variant="secondary">Registered</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right print:hidden">
                        {!registration.result ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setWithdrawing(registration)}
                            disabled={withdraw.isPending}
                            title={`Withdraw from ${course.code}`}
                          >
                            <X className="size-3.5" />
                            <span className="sr-only">Withdraw from {course.code}</span>
                          </Button>
                        ) : (
                          <span
                            className="text-xs text-muted-foreground"
                            title="Withdrawal locks once your lecturer starts grading this course"
                          >
                            Locked
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!withdrawing}
        onOpenChange={(open) => !open && setWithdrawing(null)}
        title={`Withdraw from ${withdrawing?.courseAllocation.course.code}?`}
        description="You'll be removed from this course for the current semester. If you change your mind, you'll need to register again before registration closes."
        confirmLabel="Withdraw"
        destructive
        isPending={withdraw.isPending}
        onConfirm={() => {
          if (!withdrawing) return;
          withdraw.mutate(withdrawing.id, { onSuccess: () => setWithdrawing(null) });
        }}
      />
    </div>
  );
}
