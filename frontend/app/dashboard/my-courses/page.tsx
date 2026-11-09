"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { useCourseAllocations } from "@/hooks/use-course-allocations";
import { useAcademicSessions, useActivePeriod } from "@/hooks/use-academic-sessions";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { TERM_LABEL } from "@/lib/types";

export default function MyCoursesPage() {
  const { ready } = useRequireRole("LECTURER");
  const { data: sessions } = useAcademicSessions();
  const { data: activePeriod } = useActivePeriod();

  const [sessionOverride, setSessionOverride] = useState<string>("");
  const [semesterOverride, setSemesterOverride] = useState<string>("");

  // Default to the active session/semester until the lecturer picks a past one below.
  const sessionId = sessionOverride || activePeriod?.session.id || "";
  const semesterId = semesterOverride || activePeriod?.semester.id || "";

  const selectedSession = sessions?.find((s) => s.id === sessionId);
  const isCurrentPeriod =
    !!activePeriod && sessionId === activePeriod.session.id && semesterId === activePeriod.semester.id;

  const { data, isLoading } = useCourseAllocations({ sessionId, semesterId });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">My Courses</h1>
        <p className="text-sm text-muted-foreground">Courses assigned to you, by session and semester.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={sessionId}
          onValueChange={(v) => {
            if (!v) return;
            setSessionOverride(v);
            const firstSemester = sessions?.find((s) => s.id === v)?.semesters[0];
            setSemesterOverride(firstSemester?.id ?? "");
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Session" />
          </SelectTrigger>
          <SelectContent>
            {sessions?.map((session) => (
              <SelectItem key={session.id} value={session.id}>
                {session.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={semesterId} onValueChange={(v) => v && setSemesterOverride(v)} disabled={!sessionId}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Semester" />
          </SelectTrigger>
          <SelectContent>
            {selectedSession?.semesters.map((semester) => (
              <SelectItem key={semester.id} value={semester.id}>
                {TERM_LABEL[semester.term]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!isCurrentPeriod && activePeriod && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSessionOverride("");
              setSemesterOverride("");
            }}
          >
            Jump to current semester
          </Button>
        )}
      </div>

      {!ready || isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !sessionId || !semesterId ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={BookOpen}
              title="No active semester configured yet"
              description="Ask a Super Admin to activate a session and semester, or pick one above."
            />
          </CardContent>
        </Card>
      ) : !data || data.items.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={BookOpen}
              title="No courses assigned for this semester"
              description="Once a Department Admin allocates a course to you for this period, it'll show up here."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.items.map((allocation) => (
            <Card key={allocation.id}>
              <CardHeader>
                <CardTitle>{allocation.course.code}</CardTitle>
                <CardDescription>{allocation.course.title}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {allocation.course.units} units · {allocation.course.level} Level
                </span>
                <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/dashboard/my-courses/${allocation.id}`} />}>
                  Class list <ChevronRight className="size-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
