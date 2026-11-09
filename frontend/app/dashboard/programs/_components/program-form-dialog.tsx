"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { programFormSchema, type ProgramFormValues } from "@/lib/validations/program";
import { useCreateProgram, useUpdateProgram } from "@/hooks/use-programs";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Program } from "@/lib/types";

interface ProgramFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program?: Program;
}

export function ProgramFormDialog({ open, onOpenChange, program }: ProgramFormDialogProps) {
  const isEdit = !!program;
  const { data: departments } = useDepartments();
  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();
  const pending = createProgram.isPending || updateProgram.isPending;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProgramFormValues>({
    resolver: zodResolver(programFormSchema),
    values: program
      ? {
          name: program.name,
          code: program.code,
          departmentId: program.departmentId,
          durationYears: program.durationYears,
          maxLevel: program.maxLevel,
        }
      : { name: "", code: "", departmentId: "", durationYears: 4, maxLevel: 500 },
  });

  function onSubmit(values: ProgramFormValues) {
    if (program) {
      updateProgram.mutate({ id: program.id, ...values }, { onSuccess: () => onOpenChange(false) });
    } else {
      createProgram.mutate(values, {
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
          <DialogTitle>{isEdit ? "Edit program" : "New program"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this program's details." : "Add a new program under a department."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prog-name">Name</Label>
            <Input
              id="prog-name"
              placeholder="B.Sc. Computer Science"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "prog-name-error" : undefined}
              {...register("name")}
            />
            {errors.name && (
              <p id="prog-name-error" role="alert" className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prog-code">Code</Label>
            <Input
              id="prog-code"
              placeholder="BSC-CSC"
              aria-invalid={!!errors.code}
              aria-describedby={errors.code ? "prog-code-error" : undefined}
              {...register("code")}
            />
            {errors.code && (
              <p id="prog-code-error" role="alert" className="text-sm text-destructive">
                {errors.code.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prog-dept">Department</Label>
            <Controller
              name="departmentId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="prog-dept"
                    className="w-full"
                    aria-invalid={!!errors.departmentId}
                    aria-describedby={errors.departmentId ? "prog-dept-error" : undefined}
                  >
                    <SelectValue placeholder="Select a department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.departmentId && (
              <p id="prog-dept-error" role="alert" className="text-sm text-destructive">
                {errors.departmentId.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prog-duration">Duration (years)</Label>
              <Input
                id="prog-duration"
                type="number"
                min={1}
                max={7}
                aria-invalid={!!errors.durationYears}
                aria-describedby={errors.durationYears ? "prog-duration-error" : undefined}
                {...register("durationYears", { valueAsNumber: true })}
              />
              {errors.durationYears && (
                <p id="prog-duration-error" role="alert" className="text-sm text-destructive">
                  {errors.durationYears.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prog-maxLevel">Max level</Label>
              <Input
                id="prog-maxLevel"
                type="number"
                min={100}
                max={700}
                step={100}
                aria-invalid={!!errors.maxLevel}
                aria-describedby={errors.maxLevel ? "prog-maxLevel-error" : undefined}
                {...register("maxLevel", { valueAsNumber: true })}
              />
              {errors.maxLevel && (
                <p id="prog-maxLevel-error" role="alert" className="text-sm text-destructive">
                  {errors.maxLevel.message}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {isEdit ? "Save changes" : "Create program"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
