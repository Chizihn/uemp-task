"use client";

import { useState } from "react";
import { GraduationCap, Plus, Pencil } from "lucide-react";
import { usePrograms, useUpdateProgram } from "@/hooks/use-programs";
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
import { ProgramFormDialog } from "./_components/program-form-dialog";
import type { Program } from "@/lib/types";

export default function ProgramsPage() {
  const { ready } = useRequireRole("SUPER_ADMIN");
  const { data: programs, isLoading } = usePrograms();
  const updateProgram = useUpdateProgram();
  const [dialogState, setDialogState] = useState<{ open: boolean; program?: Program }>({
    open: false,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-medium">Programs</h1>
          <p className="text-sm text-muted-foreground">
            Manage degree programs across all departments.
          </p>
        </div>
        <Button onClick={() => setDialogState({ open: true, program: undefined })}>
          <Plus className="size-4" /> New program
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All programs</CardTitle>
          <CardDescription>{programs?.length ?? 0} total</CardDescription>
        </CardHeader>
        <CardContent>
          {!ready || isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !programs || programs.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No programs yet"
              description="Create a program and assign it to a department."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Max level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs.map((program) => (
                  <TableRow key={program.id}>
                    <TableCell className="font-medium">{program.name}</TableCell>
                    <TableCell className="font-mono text-xs">{program.code}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {program.durationYears} yrs
                    </TableCell>
                    <TableCell className="text-muted-foreground">{program.maxLevel}</TableCell>
                    <TableCell>
                      <ActiveBadge isActive={program.isActive} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            updateProgram.mutate({ id: program.id, isActive: !program.isActive })
                          }
                        >
                          {program.isActive ? "Deactivate" : "Activate"}
                          <span className="sr-only"> {program.name}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDialogState({ open: true, program })}
                        >
                          <Pencil className="size-3.5" />
                          <span className="sr-only">Edit {program.name}</span>
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

      <ProgramFormDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState((s) => ({ ...s, open }))}
        program={dialogState.program}
      />
    </div>
  );
}
