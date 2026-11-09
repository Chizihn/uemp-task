"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { facultyFormSchema, type FacultyFormValues } from "@/lib/validations/faculty";
import { useCreateFaculty, useUpdateFaculty } from "@/hooks/use-faculties";
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
import type { Faculty } from "@/lib/types";

interface FacultyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  faculty?: Faculty;
}

export function FacultyFormDialog({ open, onOpenChange, faculty }: FacultyFormDialogProps) {
  const isEdit = !!faculty;
  const createFaculty = useCreateFaculty();
  const updateFaculty = useUpdateFaculty();
  const pending = createFaculty.isPending || updateFaculty.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FacultyFormValues>({
    resolver: zodResolver(facultyFormSchema),
    values: faculty ? { name: faculty.name, code: faculty.code } : { name: "", code: "" },
  });

  function onSubmit(values: FacultyFormValues) {
    if (faculty) {
      updateFaculty.mutate({ id: faculty.id, ...values }, { onSuccess: () => onOpenChange(false) });
    } else {
      createFaculty.mutate(values, {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit faculty" : "New faculty"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this faculty's details."
              : "Add a new faculty to the university structure."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="faculty-name">Name</Label>
            <Input
              id="faculty-name"
              placeholder="Faculty of Science"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "faculty-name-error" : undefined}
              {...register("name")}
            />
            {errors.name && (
              <p id="faculty-name-error" role="alert" className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="faculty-code">Code</Label>
            <Input
              id="faculty-code"
              placeholder="FOS"
              aria-invalid={!!errors.code}
              aria-describedby={errors.code ? "faculty-code-error" : undefined}
              {...register("code")}
            />
            {errors.code && (
              <p id="faculty-code-error" role="alert" className="text-sm text-destructive">
                {errors.code.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {isEdit ? "Save changes" : "Create faculty"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
