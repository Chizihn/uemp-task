"use client";

import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  LEVELS,
  updateStudentFormSchema,
  type UpdateStudentFormValues,
} from "@/lib/validations/student";
import { useUpdateStudent } from "@/hooks/use-students";
import { usePrograms } from "@/hooks/use-programs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StudentProfile } from "@/lib/types";

interface EditStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: StudentProfile;
}

export function EditStudentDialog({ open, onOpenChange, student }: EditStudentDialogProps) {
  const { data: programs } = usePrograms({ departmentId: student?.departmentId });
  const updateStudent = useUpdateStudent();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateStudentFormValues>({
    resolver: zodResolver(updateStudentFormSchema),
    values: student
      ? { matricNumber: student.matricNumber, programId: student.programId, level: student.level }
      : { matricNumber: "", programId: "", level: 100 },
  });

  function onSubmit(values: UpdateStudentFormValues) {
    if (!student) return;
    updateStudent.mutate({ id: student.id, ...values }, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit student</DialogTitle>
          <DialogDescription>
            {student?.department.name} — department can&apos;t be changed here.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="es-matricNumber">Matric number</Label>
            <Input
              id="es-matricNumber"
              aria-invalid={!!errors.matricNumber}
              aria-describedby={errors.matricNumber ? "es-matricNumber-error" : undefined}
              {...register("matricNumber")}
            />
            {errors.matricNumber && (
              <p id="es-matricNumber-error" role="alert" className="text-sm text-destructive">
                {errors.matricNumber.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="es-programId">Program</Label>
              <Controller
                name="programId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="es-programId" className="w-full">
                      <SelectValue placeholder="Select a program" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="es-level">Level</Label>
              <Controller
                name="level"
                control={control}
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger id="es-level" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVELS.map((level) => (
                        <SelectItem key={level} value={String(level)}>
                          {level} Level
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={updateStudent.isPending}>
              {updateStudent.isPending && <Loader2 className="size-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
