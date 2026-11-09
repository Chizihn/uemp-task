"use client";

import { useState } from "react";
import { GraduationCap, Pencil, Plus, Search } from "lucide-react";
import { useStudents } from "@/hooks/use-students";
import { useRequireRole } from "@/hooks/use-require-role";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatName } from "@/lib/utils";
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
import { UserStatusBadge } from "@/components/shared/status-badge";
import { CreateStudentDialog } from "./_components/create-student-dialog";
import { EditStudentDialog } from "./_components/edit-student-dialog";
import { LEVELS } from "@/lib/validations/student";
import type { StudentProfile, UserStatus } from "@/lib/types";

const TAKE = 20;
const ALL_STATUSES: UserStatus[] = ["ACTIVE", "SUSPENDED", "INACTIVE"];

export default function StudentsPage() {
  const { ready } = useRequireRole(["SUPER_ADMIN", "DEPT_ADMIN"]);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [level, setLevel] = useState<number | "ALL">("ALL");
  const [status, setStatus] = useState<UserStatus | "ALL">("ALL");
  const [skip, setSkip] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<StudentProfile | undefined>();

  const { data, isLoading } = useStudents({
    search: debouncedSearch || undefined,
    level: level === "ALL" ? undefined : level,
    status: status === "ALL" ? undefined : status,
    skip,
    take: TAKE,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-medium">Students</h1>
          <p className="text-sm text-muted-foreground">
            Register and manage students within your department.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> Register student
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All students</CardTitle>
          <CardDescription>{data?.total ?? 0} total</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-48 flex-1">
              <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by matric number or email..."
                aria-label="Search by matric number or email"
                className="pl-8"
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
              <SelectTrigger className="w-32" aria-label="Filter by level">
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
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v as UserStatus | "ALL");
                setSkip(0);
              }}
            >
              <SelectTrigger className="w-36" aria-label="Filter by status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
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
              icon={GraduationCap}
              title="No students match these filters"
              description="Try clearing the search or filters, or register the first student."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matric Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-mono text-xs">{student.matricNumber}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{student.user ? formatName(student.user) : "—"}</span>
                          <span className="text-xs text-muted-foreground">
                            {student.user?.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {student.program.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{student.level}</TableCell>
                      <TableCell>
                        <UserStatusBadge status={student.user?.status ?? "ACTIVE"} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon-sm" onClick={() => setEditing(student)}>
                          <Pencil className="size-3.5" />
                          <span className="sr-only">Edit {student.matricNumber}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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

      <CreateStudentDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditStudentDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(undefined)}
        student={editing}
      />
    </div>
  );
}
