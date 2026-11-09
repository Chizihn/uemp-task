"use client";

import { useState } from "react";
import { useUpdateDeptAdmin } from "@/hooks/use-dept-admins";
import { useDepartments } from "@/hooks/use-departments";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatName } from "@/lib/utils";
import type { DeptAdminProfile } from "@/lib/types";

interface ReassignDeptAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deptAdmin?: DeptAdminProfile;
}

export function ReassignDeptAdminDialog({
  open,
  onOpenChange,
  deptAdmin,
}: ReassignDeptAdminDialogProps) {
  const { data: departments } = useDepartments();
  const updateDeptAdmin = useUpdateDeptAdmin();
  const [departmentId, setDepartmentId] = useState(deptAdmin?.departmentId ?? "");

  function handleSubmit() {
    if (!deptAdmin || !departmentId) return;
    updateDeptAdmin.mutate(
      { id: deptAdmin.id, departmentId },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) setDepartmentId(deptAdmin?.departmentId ?? "");
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reassign department</DialogTitle>
          <DialogDescription>
            {deptAdmin?.user ? formatName(deptAdmin.user) : ""} currently manages{" "}
            {deptAdmin?.department.name}.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rda-departmentId">New department</Label>
            <Select value={departmentId} onValueChange={(v) => setDepartmentId(v ?? "")}>
              <SelectTrigger id="rda-departmentId" className="w-full">
                <SelectValue placeholder="Select a department" />
              </SelectTrigger>
              <SelectContent>
                {departments?.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={!departmentId || departmentId === deptAdmin?.departmentId || updateDeptAdmin.isPending}
            >
              Reassign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
