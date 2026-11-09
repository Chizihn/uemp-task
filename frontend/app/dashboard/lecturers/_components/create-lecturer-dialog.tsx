"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createLecturerFormSchema,
  type CreateLecturerFormValues,
} from "@/lib/validations/lecturer";
import { useCreateLecturer } from "@/hooks/use-lecturers";
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

interface CreateLecturerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateLecturerDialog({ open, onOpenChange }: CreateLecturerDialogProps) {
  const { data: me } = useCurrentUser();
  const ownDepartmentId = me?.deptAdminProfile?.departmentId;
  const isDeptAdmin = me?.role === "DEPT_ADMIN";

  const { data: departments } = useDepartments();
  const createLecturer = useCreateLecturer();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateLecturerFormValues>({
    resolver: zodResolver(createLecturerFormSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      password: "",
      staffId: "",
      title: "",
      departmentId: ownDepartmentId ?? "",
    },
  });

  useEffect(() => {
    if (isDeptAdmin && ownDepartmentId) {
      setValue("departmentId", ownDepartmentId);
    }
  }, [isDeptAdmin, ownDepartmentId, setValue]);

  function onSubmit(values: CreateLecturerFormValues) {
    createLecturer.mutate(values, {
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
          <DialogTitle>New lecturer</DialogTitle>
          <DialogDescription>Creates the account and lecturer profile together.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cl-firstName">First name</Label>
              <Input
                id="cl-firstName"
                aria-invalid={!!errors.firstName}
                aria-describedby={errors.firstName ? "cl-firstName-error" : undefined}
                {...register("firstName")}
              />
              {errors.firstName && (
                <p id="cl-firstName-error" role="alert" className="text-sm text-destructive">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cl-middleName">Middle name</Label>
              <Input id="cl-middleName" {...register("middleName")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cl-lastName">Last name</Label>
              <Input
                id="cl-lastName"
                aria-invalid={!!errors.lastName}
                aria-describedby={errors.lastName ? "cl-lastName-error" : undefined}
                {...register("lastName")}
              />
              {errors.lastName && (
                <p id="cl-lastName-error" role="alert" className="text-sm text-destructive">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cl-email">Email</Label>
            <Input
              id="cl-email"
              type="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "cl-email-error" : undefined}
              {...register("email")}
            />
            {errors.email && (
              <p id="cl-email-error" role="alert" className="text-sm text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cl-password">Temporary password</Label>
            <Input
              id="cl-password"
              type="text"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "cl-password-error" : undefined}
              {...register("password")}
            />
            {errors.password && (
              <p id="cl-password-error" role="alert" className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cl-staffId">Staff ID</Label>
              <Input
                id="cl-staffId"
                placeholder="LEC-001"
                aria-invalid={!!errors.staffId}
                aria-describedby={errors.staffId ? "cl-staffId-error" : undefined}
                {...register("staffId")}
              />
              {errors.staffId && (
                <p id="cl-staffId-error" role="alert" className="text-sm text-destructive">
                  {errors.staffId.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cl-title">Title (optional)</Label>
              <Input id="cl-title" placeholder="Dr." {...register("title")} />
            </div>
          </div>

          {!isDeptAdmin && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cl-departmentId">Department</Label>
              <Controller
                name="departmentId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="cl-departmentId"
                      className="w-full"
                      aria-invalid={!!errors.departmentId}
                      aria-describedby={errors.departmentId ? "cl-dept-error" : undefined}
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
                <p id="cl-dept-error" role="alert" className="text-sm text-destructive">
                  {errors.departmentId.message}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={createLecturer.isPending}>
              Create lecturer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
