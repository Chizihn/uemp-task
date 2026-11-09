"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCourseFormSchema, type CreateCourseFormValues } from "@/lib/validations/course";
import { LEVELS, TERMS } from "@/lib/constants";
import { useCreateCourse } from "@/hooks/use-courses";
import { useDepartments } from "@/hooks/use-departments";
import { useCurrentUser } from "@/hooks/use-auth";
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
import { TERM_LABEL } from "@/lib/types";

interface CreateCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCourseDialog({ open, onOpenChange }: CreateCourseDialogProps) {
  const { data: me } = useCurrentUser();
  const ownDepartmentId = me?.deptAdminProfile?.departmentId;
  const isDeptAdmin = me?.role === "DEPT_ADMIN";

  const { data: departments } = useDepartments();
  const createCourse = useCreateCourse();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateCourseFormValues>({
    resolver: zodResolver(createCourseFormSchema),
    defaultValues: {
      code: "",
      title: "",
      units: 3,
      level: 100,
      term: "FIRST",
      departmentId: ownDepartmentId ?? "",
    },
  });

  useEffect(() => {
    if (isDeptAdmin && ownDepartmentId) {
      setValue("departmentId", ownDepartmentId);
    }
  }, [isDeptAdmin, ownDepartmentId, setValue]);

  function onSubmit(values: CreateCourseFormValues) {
    createCourse.mutate(values, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New course</DialogTitle>
          <DialogDescription>Add a course to the department catalog.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cc-code">Course code</Label>
              <Input
                id="cc-code"
                placeholder="CSC301"
                aria-invalid={!!errors.code}
                aria-describedby={errors.code ? "cc-code-error" : undefined}
                {...register("code")}
              />
              {errors.code && (
                <p id="cc-code-error" role="alert" className="text-sm text-destructive">
                  {errors.code.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cc-units">Units</Label>
              <Input
                id="cc-units"
                type="number"
                min={1}
                max={6}
                aria-invalid={!!errors.units}
                aria-describedby={errors.units ? "cc-units-error" : undefined}
                {...register("units", { valueAsNumber: true })}
              />
              {errors.units && (
                <p id="cc-units-error" role="alert" className="text-sm text-destructive">
                  {errors.units.message}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cc-title">Title</Label>
            <Input
              id="cc-title"
              placeholder="Software Engineering"
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? "cc-title-error" : undefined}
              {...register("title")}
            />
            {errors.title && (
              <p id="cc-title-error" role="alert" className="text-sm text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cc-level">Level</Label>
              <Controller
                name="level"
                control={control}
                render={({ field }) => (
                  <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                    <SelectTrigger id="cc-level" className="w-full">
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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cc-term">Term</Label>
              <Controller
                name="term"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="cc-term" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TERMS.map((term) => (
                        <SelectItem key={term} value={term}>
                          {TERM_LABEL[term]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {!isDeptAdmin && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cc-departmentId">Department</Label>
              <Controller
                name="departmentId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="cc-departmentId"
                      className="w-full"
                      aria-invalid={!!errors.departmentId}
                      aria-describedby={errors.departmentId ? "cc-dept-error" : undefined}
                    >
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
                )}
              />
              {errors.departmentId && (
                <p id="cc-dept-error" role="alert" className="text-sm text-destructive">
                  {errors.departmentId.message}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={createCourse.isPending}>
              Create course
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
