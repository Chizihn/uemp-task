"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useLecturers } from "@/hooks/use-lecturers";
import { useCreateAllocation, useUpdateAllocation } from "@/hooks/use-course-allocations";
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
import { lecturerDisplayName } from "@/lib/utils";
import type { ActivePeriod, Course, CourseAllocation } from "@/lib/types";

interface AssignLecturerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: Course;
  existingAllocation?: CourseAllocation;
  activePeriod?: ActivePeriod;
}

export function AssignLecturerDialog({
  open,
  onOpenChange,
  course,
  existingAllocation,
  activePeriod,
}: AssignLecturerDialogProps) {
  const { data: lecturers } = useLecturers({ departmentId: course?.departmentId, status: "ACTIVE" });
  const createAllocation = useCreateAllocation();
  const updateAllocation = useUpdateAllocation();
  const [lecturerId, setLecturerId] = useState(existingAllocation?.lecturerId ?? "");

  const pending = createAllocation.isPending || updateAllocation.isPending;

  function handleSubmit() {
    if (!course || !lecturerId) return;

    if (existingAllocation) {
      updateAllocation.mutate(
        { id: existingAllocation.id, lecturerId },
        { onSuccess: () => onOpenChange(false) },
      );
      return;
    }

    if (!activePeriod) return;
    createAllocation.mutate(
      {
        courseId: course.id,
        lecturerId,
        sessionId: activePeriod.session.id,
        semesterId: activePeriod.semester.id,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) setLecturerId(existingAllocation?.lecturerId ?? "");
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{existingAllocation ? "Reassign lecturer" : "Assign lecturer"}</DialogTitle>
          <DialogDescription>
            {course?.code} — {activePeriod?.session.name ?? "no active session configured"}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex flex-col gap-4"
        >
          {!activePeriod && !existingAllocation ? (
            <p className="text-sm text-destructive">
              No active academic session/semester is configured yet — ask a Super Admin to
              activate one before assigning lecturers.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lecturerId">Lecturer</Label>
              <Select value={lecturerId} onValueChange={(v) => setLecturerId(v ?? "")}>
                <SelectTrigger id="lecturerId" className="w-full">
                  <SelectValue placeholder="Select a lecturer" />
                </SelectTrigger>
                <SelectContent>
                  {lecturers?.items.map((lecturer) => (
                    <SelectItem key={lecturer.id} value={lecturer.id}>
                      {lecturerDisplayName(lecturer)} ({lecturer.staffId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button
              type="submit"
              disabled={!lecturerId || pending || (!activePeriod && !existingAllocation)}
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              {existingAllocation ? "Reassign" : "Assign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
