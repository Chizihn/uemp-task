"use client";

import { useState } from "react";
import { Pencil, Plus, UserCog } from "lucide-react";
import { useDeptAdmins } from "@/hooks/use-dept-admins";
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
import { UserStatusBadge } from "@/components/shared/status-badge";
import { formatName } from "@/lib/utils";
import type { DeptAdminProfile } from "@/lib/types";
import { DeptAdminFormDialog } from "./_components/dept-admin-form-dialog";
import { ReassignDeptAdminDialog } from "./_components/reassign-dept-admin-dialog";

export default function DeptAdminsPage() {
  const { ready } = useRequireRole("SUPER_ADMIN");
  const { data, isLoading } = useDeptAdmins();
  const [createOpen, setCreateOpen] = useState(false);
  const [reassigning, setReassigning] = useState<DeptAdminProfile | undefined>();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-medium">Department Admins</h1>
          <p className="text-sm text-muted-foreground">
            Create department admin accounts and reassign them between departments.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> New department admin
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All department admins</CardTitle>
          <CardDescription>{data?.length ?? 0} total</CardDescription>
        </CardHeader>
        <CardContent>
          {!ready || isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !data || data.length === 0 ? (
            <EmptyState
              icon={UserCog}
              title="No department admins yet"
              description="Create one to delegate management of a department."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((deptAdmin) => (
                  <TableRow key={deptAdmin.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{deptAdmin.user ? formatName(deptAdmin.user) : "—"}</span>
                        <span className="text-xs text-muted-foreground">
                          {deptAdmin.user?.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {deptAdmin.department.name}
                    </TableCell>
                    <TableCell>
                      <UserStatusBadge status={deptAdmin.user?.status ?? "ACTIVE"} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setReassigning(deptAdmin)}
                        title={`Reassign ${deptAdmin.user ? formatName(deptAdmin.user) : ""}`}
                      >
                        <Pencil className="size-3.5" />
                        <span className="sr-only">
                          Reassign {deptAdmin.user ? formatName(deptAdmin.user) : ""}
                        </span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DeptAdminFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ReassignDeptAdminDialog
        open={!!reassigning}
        onOpenChange={(open) => !open && setReassigning(undefined)}
        deptAdmin={reassigning}
      />
    </div>
  );
}
