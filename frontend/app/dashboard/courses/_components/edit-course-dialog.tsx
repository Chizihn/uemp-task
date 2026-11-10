"use client";

import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateCourseFormSchema, type UpdateCourseFormValues } from "@/lib/validations/course";
import { LEVELS, TERMS } from "@/lib/constants";
import { useUpdateCourse } from "@/hooks/use-courses";
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
import { TERM_LABEL, type Course } from "@/lib/types";

interface EditCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: Course;
}

export function EditCourseDialog({ open, onOpenChange, course }: EditCourseDialogProps) {
  const updateCourse = useUpdateCourse();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateCourseFormValues>({
    resolver: zodResolver(updateCourseFormSchema),
    values: course
      ? { code: course.code, title: course.title, units: course.units, level: course.level, term: course.term }
      : { code: "", title: "", units: 3, level: 100, term: "FIRST" },
  });

  function onSubmit(values: UpdateCourseFormValues) {
    if (!course) return;
    updateCourse.mutate({ id: course.id, ...values }, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit course</DialogTitle>
          <DialogDescription>
            {course?.department?.name} — department can&apos;t be changed here.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ec-code">Course code</Label>
              <Input
                id="ec-code"
                aria-invalid={!!errors.code}
                aria-describedby={errors.code ? "ec-code-error" : undefined}
                {...register("code")}
              />
              {errors.code && (
                <p id="ec-code-error" role="alert" className="text-sm text-destructive">
                  {errors.code.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ec-units">Units</Label>
              <Input
                id="ec-units"
                type="number"
                min={1}
                max={6}
                aria-invalid={!!errors.units}
                aria-describedby={errors.units ? "ec-units-error" : undefined}
                {...register("units", { valueAsNumber: true })}
              />
              {errors.units && (
                <p id="ec-units-error" role="alert" className="text-sm text-destructive">
                  {errors.units.message}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ec-title">Title</Label>
            <Input
              id="ec-title"
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? "ec-title-error" : undefined}
              {...register("title")}
            />
            {errors.title && (
              <p id="ec-title-error" role="alert" className="text-sm text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ec-level">Level</Label>
              <Controller
                name="level"
                control={control}
                render={({ field }) => (
                  <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                    <SelectTrigger id="ec-level" className="w-full">
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
              <Label htmlFor="ec-term">Term</Label>
              <Controller
                name="term"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="ec-term" className="w-full">
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
          <DialogFooter>
            <Button type="submit" disabled={updateCourse.isPending}>
              {updateCourse.isPending && <Loader2 className="size-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
