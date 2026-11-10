"use client";

import { useState } from "react";
import { Landmark, Plus, Pencil } from "lucide-react";
import { useFaculties, useUpdateFaculty } from "@/hooks/use-faculties";
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FacultyFormDialog } from "./_components/faculty-form-dialog";
import type { Faculty } from "@/lib/types";

export default function FacultiesPage() {
  const { ready } = useRequireRole("SUPER_ADMIN");
  const { data: faculties, isLoading } = useFaculties();
  const updateFaculty = useUpdateFaculty();
  const [dialogState, setDialogState] = useState<{ open: boolean; faculty?: Faculty }>({
    open: false,
  });
  const [deactivating, setDeactivating] = useState<Faculty | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-medium">Faculties</h1>
          <p className="text-sm text-muted-foreground">
            Manage the university&apos;s faculty structure.
          </p>
        </div>
        <Button onClick={() => setDialogState({ open: true, faculty: undefined })}>
          <Plus className="size-4" /> New faculty
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All faculties</CardTitle>
          <CardDescription>{faculties?.length ?? 0} total</CardDescription>
        </CardHeader>
        <CardContent>
          {!ready || isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !faculties || faculties.length === 0 ? (
            <EmptyState
              icon={Landmark}
              title="No faculties yet"
              description="Create your first faculty to start building the university structure."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faculties.map((faculty) => (
                  <TableRow key={faculty.id}>
                    <TableCell className="font-medium">{faculty.name}</TableCell>
                    <TableCell className="font-mono text-xs">{faculty.code}</TableCell>
                    <TableCell>
                      <ActiveBadge isActive={faculty.isActive} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            faculty.isActive
                              ? setDeactivating(faculty)
                              : updateFaculty.mutate({ id: faculty.id, isActive: true })
                          }
                        >
                          {faculty.isActive ? "Deactivate" : "Activate"}
                          <span className="sr-only"> {faculty.name}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDialogState({ open: true, faculty })}
                          title={`Edit ${faculty.name}`}
                        >
                          <Pencil className="size-3.5" />
                          <span className="sr-only">Edit {faculty.name}</span>
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

      <FacultyFormDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState((s) => ({ ...s, open }))}
        faculty={dialogState.faculty}
      />

      <ConfirmDialog
        open={!!deactivating}
        onOpenChange={(open) => !open && setDeactivating(null)}
        title={`Deactivate ${deactivating?.name}?`}
        description="Its departments, programs, and courses will stop appearing as options across the system until it's reactivated."
        confirmLabel="Deactivate"
        destructive
        isPending={updateFaculty.isPending}
        onConfirm={() => {
          if (!deactivating) return;
          updateFaculty.mutate(
            { id: deactivating.id, isActive: false },
            { onSuccess: () => setDeactivating(null) },
          );
        }}
      />
    </div>
  );
}
