"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, ClipboardList, Pencil, Plus, Search, UserPlus } from "lucide-react";
import { useCourses } from "@/hooks/use-courses";
import { useCourseAllocations } from "@/hooks/use-course-allocations";
import { useActivePeriod } from "@/hooks/use-academic-sessions";
import { useRequireRole } from "@/hooks/use-require-role";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { ActiveBadge } from "@/components/shared/status-badge";
import { LEVELS } from "@/lib/constants";
import { TERM_LABEL, type Course, type CourseAllocation } from "@/lib/types";
import { CreateCourseDialog } from "./_components/create-course-dialog";
import { EditCourseDialog } from "./_components/edit-course-dialog";
import { AssignLecturerDialog } from "./_components/assign-lecturer-dialog";
import { lecturerDisplayName } from "@/lib/utils";

const TAKE = 20;

export default function CoursesPage() {
  const { ready } = useRequireRole(["SUPER_ADMIN", "DEPT_ADMIN"]);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [level, setLevel] = useState<number | "ALL">("ALL");
  const [skip, setSkip] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Course | undefined>();
  const [assigning, setAssigning] = useState<Course | undefined>();

  const { data, isLoading } = useCourses({
    search: debouncedSearch || undefined,
    level: level === "ALL" ? undefined : level,
    skip,
    take: TAKE,
  });

  const { data: activePeriod } = useActivePeriod();
  const { data: allocations } = useCourseAllocations({
    sessionId: activePeriod?.session.id,
    semesterId: activePeriod?.semester.id,
  });

  const allocationByCourseId = useMemo(() => {
    const map = new Map<string, CourseAllocation>();
    for (const allocation of allocations?.items ?? []) {
      map.set(allocation.courseId, allocation);
    }
    return map;
  }, [allocations]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-medium">Courses</h1>
          <p className="text-sm text-muted-foreground">
            Manage the course catalog and assign lecturers for the active semester.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> New course
        </Button>
      </div>

      {!activePeriod && (
        <Card className="border-dashed">
          <CardContent className="py-4 text-sm text-muted-foreground">
            No academic session/semester is active yet, so lecturer assignment is unavailable —
            the course catalog itself can still be managed.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All courses</CardTitle>
          <CardDescription>{data?.total ?? 0} total</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-48 flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search by code or title..."
                aria-label="Search by code or title"
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSkip(0);
                }}
              />
            </div>
            <Select
              value={String(level)}
              onValueChange={(v) => {
                setLevel(v === "ALL" ? "ALL" : Number(v));
                setSkip(0);
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All levels</SelectItem>
                {LEVELS.map((l) => (
                  <SelectItem key={l} value={String(l)}>
                    {l} Level
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!ready || isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !data || data.items.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No courses match these filters"
              description="Try clearing the search or filters, or create the first course."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Lecturer (active semester)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((course) => {
                    const allocation = allocationByCourseId.get(course.id);
                    return (
                      <TableRow key={course.id}>
                        <TableCell className="font-mono text-xs">{course.code}</TableCell>
                        <TableCell className="font-medium">{course.title}</TableCell>
                        <TableCell className="text-muted-foreground">{course.units}</TableCell>
                        <TableCell className="text-muted-foreground">{course.level}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {TERM_LABEL[course.term]}
                        </TableCell>
                        <TableCell>
                          <ActiveBadge isActive={course.isActive} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {allocation ? lecturerDisplayName(allocation.lecturer) : "Unassigned"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {allocation && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                nativeButton={false}
                                render={<Link href={`/dashboard/my-courses/${allocation.id}`} />}
                                title="View class list"
                              >
                                <ClipboardList className="size-3.5" />
                                <span className="sr-only">View class list for {course.code}</span>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setAssigning(course)}
                              disabled={!activePeriod && !allocation}
                              title={`Assign lecturer to ${course.code}`}
                            >
                              <UserPlus className="size-3.5" />
                              <span className="sr-only">Assign lecturer to {course.code}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setEditing(course)}
                              title={`Edit ${course.code}`}
                            >
                              <Pencil className="size-3.5" />
                              <span className="sr-only">Edit {course.code}</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <PaginationControls
                skip={data.skip}
                take={data.take}
                total={data.total}
                onSkipChange={setSkip}
              />
            </>
          )}
        </CardContent>
      </Card>

      <CreateCourseDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditCourseDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(undefined)}
        course={editing}
      />
      <AssignLecturerDialog
        open={!!assigning}
        onOpenChange={(open) => !open && setAssigning(undefined)}
        course={assigning}
        existingAllocation={assigning ? allocationByCourseId.get(assigning.id) : undefined}
        activePeriod={activePeriod}
      />
    </div>
  );
}
