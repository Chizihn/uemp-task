"use client";

import Link from "next/link";
import { BookOpen, CheckSquare, ClipboardList, ShieldCheck } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-auth";
import { useActivePeriod } from "@/hooks/use-academic-sessions";
import { useCourseAllocations } from "@/hooks/use-course-allocations";
import { useMyRegistrations } from "@/hooks/use-registrations";
import { useStudents } from "@/hooks/use-students";
import { useLecturers } from "@/hooks/use-lecturers";
import { usePendingResults } from "@/hooks/use-results";
import { useFaculties } from "@/hooks/use-faculties";
import { useDepartments } from "@/hooks/use-departments";
import { useUsers } from "@/hooks/use-users";
import { useAuditLog } from "@/hooks/use-audit-log";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ResultStatusBadge } from "@/components/shared/status-badge";
import { formatName } from "@/lib/utils";
import type { CurrentUser } from "@/lib/types";

// One URL for everyone — the content below is what's actually dynamic per role,
// rather than the URL itself announcing who's logged in.
export default function DashboardPage() {
  const { data: user } = useCurrentUser();
  if (!user) return null;

  switch (user.role) {
    case "STUDENT":
      return <StudentHome user={user} />;
    case "LECTURER":
      return <LecturerHome user={user} />;
    case "DEPT_ADMIN":
      return <DeptAdminHome user={user} />;
    case "SUPER_ADMIN":
      return <SuperAdminHome user={user} />;
  }
}

function StudentHome({ user }: { user: CurrentUser }) {
  const student = user.student;
  const { data: activePeriod } = useActivePeriod();
  const { data: registrations } = useMyRegistrations({
    sessionId: activePeriod?.session.id,
    semesterId: activePeriod?.semester.id,
  });

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
          {!registrations || registrations.registrations.length === 0 ? (
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

function LecturerHome({ user }: { user: CurrentUser }) {
  const lecturer = user.lecturer;
  const { data: activePeriod } = useActivePeriod();
  const { data: allocations } = useCourseAllocations({
    sessionId: activePeriod?.session.id,
    semesterId: activePeriod?.semester.id,
  });

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
          {!allocations || allocations.items.length === 0 ? (
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

function DeptAdminHome({ user }: { user: CurrentUser }) {
  const department = user.deptAdminProfile?.department;
  const { data: students } = useStudents({ take: 1 });
  const { data: lecturers } = useLecturers({ take: 1 });
  const { data: pending } = usePendingResults({ take: 5 });

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
        <StatCard label="Students" value={students?.total} />
        <StatCard label="Lecturers" value={lecturers?.total} />
        <StatCard label="Pending approvals" value={pending?.total} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending result approvals</CardTitle>
          <CardDescription>Submissions awaiting your review appear here.</CardDescription>
        </CardHeader>
        <CardContent>
          {!pending || pending.items.length === 0 ? (
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

function SuperAdminHome({ user }: { user: CurrentUser }) {
  const { data: faculties } = useFaculties();
  const { data: departments } = useDepartments();
  const { data: students } = useUsers({ role: "STUDENT", take: 1 });
  const { data: lecturers } = useUsers({ role: "LECTURER", take: 1 });
  const { data: auditLog } = useAuditLog({ take: 5 });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">University overview</h1>
        <p className="text-sm text-muted-foreground">
          {user.firstName} {user.lastName} · {user.email}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Faculties" value={faculties?.length} />
        <StatCard label="Departments" value={departments?.length} />
        <StatCard label="Students" value={students?.total} />
        <StatCard label="Lecturers" value={lecturers?.total} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>The latest entries from the system audit log.</CardDescription>
        </CardHeader>
        <CardContent>
          {!auditLog || auditLog.items.length === 0 ? (
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

function InfoCard({ label, value }: { label: string; value?: string }) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="font-heading text-lg font-medium">{value ?? "—"}</span>
      </CardContent>
    </Card>
  );
}

function StatCard({ label, value }: { label: string; value?: number }) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="font-heading text-2xl font-medium">{value ?? "—"}</span>
      </CardContent>
    </Card>
  );
}
