"use client";

import { useState } from "react";
import { Building2, Plus, Pencil } from "lucide-react";
import { useDepartments, useUpdateDepartment } from "@/hooks/use-departments";
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
import { ActiveBadge } from "@/components/shared/status-badge";
import { DepartmentFormDialog } from "./_components/department-form-dialog";
import type { Department } from "@/lib/types";

export default function DepartmentsPage() {
  const { ready } = useRequireRole("SUPER_ADMIN");
  const { data: departments, isLoading } = useDepartments();
  const updateDepartment = useUpdateDepartment();
  const [dialogState, setDialogState] = useState<{ open: boolean; department?: Department }>({
    open: false,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-medium">Departments</h1>
          <p className="text-sm text-muted-foreground">
            Manage academic departments across all faculties.
          </p>
        </div>
        <Button onClick={() => setDialogState({ open: true, department: undefined })}>
          <Plus className="size-4" /> New department
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All departments</CardTitle>
          <CardDescription>{departments?.length ?? 0} total</CardDescription>
        </CardHeader>
        <CardContent>
          {!ready || isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !departments || departments.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No departments yet"
              description="Create a department and assign it to a faculty."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell className="font-medium">{department.name}</TableCell>
                    <TableCell className="font-mono text-xs">{department.code}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {department.faculty?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <ActiveBadge isActive={department.isActive} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            updateDepartment.mutate({
                              id: department.id,
                              isActive: !department.isActive,
                            })
                          }
                        >
                          {department.isActive ? "Deactivate" : "Activate"}
                          <span className="sr-only"> {department.name}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDialogState({ open: true, department })}
                        >
                          <Pencil className="size-3.5" />
                          <span className="sr-only">Edit {department.name}</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DepartmentFormDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState((s) => ({ ...s, open }))}
        department={dialogState.department}
      />
    </div>
  );
}
