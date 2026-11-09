"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { departmentFormSchema, type DepartmentFormValues } from "@/lib/validations/department";
import { useCreateDepartment, useUpdateDepartment } from "@/hooks/use-departments";
import { useFaculties } from "@/hooks/use-faculties";
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
import type { Department } from "@/lib/types";

interface DepartmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: Department;
}

export function DepartmentFormDialog({
  open,
  onOpenChange,
  department,
}: DepartmentFormDialogProps) {
  const isEdit = !!department;
  const { data: faculties } = useFaculties();
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const pending = createDepartment.isPending || updateDepartment.isPending;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    values: department
      ? { name: department.name, code: department.code, facultyId: department.facultyId }
      : { name: "", code: "", facultyId: "" },
  });

  function onSubmit(values: DepartmentFormValues) {
    if (department) {
      updateDepartment.mutate(
        { id: department.id, ...values },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createDepartment.mutate(values, {
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
          <DialogTitle>{isEdit ? "Edit department" : "New department"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this department's details."
              : "Add a new department under a faculty."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dept-name">Name</Label>
            <Input
              id="dept-name"
              placeholder="Computer Science"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "dept-name-error" : undefined}
              {...register("name")}
            />
            {errors.name && (
              <p id="dept-name-error" role="alert" className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dept-code">Code</Label>
            <Input
              id="dept-code"
              placeholder="CSC"
              aria-invalid={!!errors.code}
              aria-describedby={errors.code ? "dept-code-error" : undefined}
              {...register("code")}
            />
            {errors.code && (
              <p id="dept-code-error" role="alert" className="text-sm text-destructive">
                {errors.code.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dept-facultyId">Faculty</Label>
            <Controller
              name="facultyId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="dept-facultyId"
                    className="w-full"
                    aria-invalid={!!errors.facultyId}
                    aria-describedby={errors.facultyId ? "dept-faculty-error" : undefined}
                  >
                    <SelectValue placeholder="Select a faculty" />
                  </SelectTrigger>
                  <SelectContent>
                    {faculties?.map((faculty) => (
                      <SelectItem key={faculty.id} value={faculty.id}>
                        {faculty.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.facultyId && (
              <p id="dept-faculty-error" role="alert" className="text-sm text-destructive">
                {errors.facultyId.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {isEdit ? "Save changes" : "Create department"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
