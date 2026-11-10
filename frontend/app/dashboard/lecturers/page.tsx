"use client";

import { useState } from "react";
import { Pencil, Plus, Search, UserCog } from "lucide-react";
import { useLecturers } from "@/hooks/use-lecturers";
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
import { CreateLecturerDialog } from "./_components/create-lecturer-dialog";
import { EditLecturerDialog } from "./_components/edit-lecturer-dialog";
import type { LecturerProfile, UserStatus } from "@/lib/types";

const TAKE = 20;
const ALL_STATUSES: UserStatus[] = ["ACTIVE", "SUSPENDED", "INACTIVE"];

export default function LecturersPage() {
  const { ready } = useRequireRole(["SUPER_ADMIN", "DEPT_ADMIN"]);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [status, setStatus] = useState<UserStatus | "ALL">("ALL");
  const [skip, setSkip] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<LecturerProfile | undefined>();

  const { data, isLoading } = useLecturers({
    search: debouncedSearch || undefined,
    status: status === "ALL" ? undefined : status,
    skip,
    take: TAKE,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-medium">Lecturers</h1>
          <p className="text-sm text-muted-foreground">
            Manage lecturer profiles within your department.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> New lecturer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All lecturers</CardTitle>
          <CardDescription>{data?.total ?? 0} total</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-48 flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search by staff ID or email..."
                aria-label="Search by staff ID or email"
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSkip(0);
                }}
              />
            </div>
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
              icon={UserCog}
              title="No lecturers match these filters"
              description="Try clearing the search or filters, or create the first lecturer."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((lecturer) => (
                    <TableRow key={lecturer.id}>
                      <TableCell className="font-mono text-xs">{lecturer.staffId}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{lecturer.user ? formatName(lecturer.user) : "—"}</span>
                          <span className="text-xs text-muted-foreground">
                            {lecturer.user?.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {lecturer.title ?? "—"}
                      </TableCell>
                      <TableCell>
                        <UserStatusBadge status={lecturer.user?.status ?? "ACTIVE"} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setEditing(lecturer)}
                          title={`Edit ${lecturer.staffId}`}
                        >
                          <Pencil className="size-3.5" />
                          <span className="sr-only">Edit {lecturer.staffId}</span>
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

      <CreateLecturerDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditLecturerDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(undefined)}
        lecturer={editing}
      />
    </div>
  );
}
