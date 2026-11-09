"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateLecturerFormSchema,
  type UpdateLecturerFormValues,
} from "@/lib/validations/lecturer";
import { useUpdateLecturer } from "@/hooks/use-lecturers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LecturerProfile } from "@/lib/types";

interface EditLecturerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lecturer?: LecturerProfile;
}

export function EditLecturerDialog({ open, onOpenChange, lecturer }: EditLecturerDialogProps) {
  const updateLecturer = useUpdateLecturer();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateLecturerFormValues>({
    resolver: zodResolver(updateLecturerFormSchema),
    values: lecturer
      ? { staffId: lecturer.staffId, title: lecturer.title ?? "" }
      : { staffId: "", title: "" },
  });

  function onSubmit(values: UpdateLecturerFormValues) {
    if (!lecturer) return;
    updateLecturer.mutate({ id: lecturer.id, ...values }, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit lecturer</DialogTitle>
          <DialogDescription>
            {lecturer?.department.name} — department can&apos;t be changed here.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="el-staffId">Staff ID</Label>
            <Input
              id="el-staffId"
              aria-invalid={!!errors.staffId}
              aria-describedby={errors.staffId ? "el-staffId-error" : undefined}
              {...register("staffId")}
            />
            {errors.staffId && (
              <p id="el-staffId-error" role="alert" className="text-sm text-destructive">
                {errors.staffId.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="el-title">Title</Label>
            <Input id="el-title" placeholder="Dr." {...register("title")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={updateLecturer.isPending}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
