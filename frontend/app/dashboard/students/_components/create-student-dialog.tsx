"use client";

import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createStudentFormSchema,
  LEVELS,
  type CreateStudentFormValues,
} from "@/lib/validations/student";
import { useCreateStudent } from "@/hooks/use-students";
import { useDepartments } from "@/hooks/use-departments";
import { usePrograms } from "@/hooks/use-programs";
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

interface CreateStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateStudentDialog({ open, onOpenChange }: CreateStudentDialogProps) {
  const { data: me } = useCurrentUser();
  const ownDepartmentId = me?.deptAdminProfile?.departmentId;
  const isDeptAdmin = me?.role === "DEPT_ADMIN";

  const { data: departments } = useDepartments();
  const createStudent = useCreateStudent();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateStudentFormValues>({
    resolver: zodResolver(createStudentFormSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      password: "",
      matricNumber: "",
      departmentId: ownDepartmentId ?? "",
      programId: "",
      level: 100,
    },
  });

  const departmentId = useWatch({ control, name: "departmentId" });
  const { data: programs } = usePrograms({ departmentId: departmentId || undefined });

  // A Dept Admin's department is fixed — fill it in as soon as we know it.
  useEffect(() => {
    if (isDeptAdmin && ownDepartmentId) {
      setValue("departmentId", ownDepartmentId);
    }
  }, [isDeptAdmin, ownDepartmentId, setValue]);

  function onSubmit(values: CreateStudentFormValues) {
    createStudent.mutate(values, {
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
          <DialogTitle>Register student</DialogTitle>
          <DialogDescription>Creates the account and student profile together.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cs-firstName">First name</Label>
              <Input
                id="cs-firstName"
                aria-invalid={!!errors.firstName}
                aria-describedby={errors.firstName ? "cs-firstName-error" : undefined}
                {...register("firstName")}
              />
              {errors.firstName && (
                <p id="cs-firstName-error" role="alert" className="text-sm text-destructive">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cs-middleName">Middle name</Label>
              <Input id="cs-middleName" {...register("middleName")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cs-lastName">Last name</Label>
              <Input
                id="cs-lastName"
                aria-invalid={!!errors.lastName}
                aria-describedby={errors.lastName ? "cs-lastName-error" : undefined}
                {...register("lastName")}
              />
              {errors.lastName && (
                <p id="cs-lastName-error" role="alert" className="text-sm text-destructive">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cs-email">Email</Label>
            <Input
              id="cs-email"
              type="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "cs-email-error" : undefined}
              {...register("email")}
            />
            {errors.email && (
              <p id="cs-email-error" role="alert" className="text-sm text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cs-password">Temporary password</Label>
            <Input
              id="cs-password"
              type="text"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "cs-password-error" : undefined}
              {...register("password")}
            />
            {errors.password && (
              <p id="cs-password-error" role="alert" className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cs-matricNumber">Matric number</Label>
            <Input
              id="cs-matricNumber"
              placeholder="CSC/2024/001"
              aria-invalid={!!errors.matricNumber}
              aria-describedby={errors.matricNumber ? "cs-matricNumber-error" : undefined}
              {...register("matricNumber")}
            />
            {errors.matricNumber && (
              <p id="cs-matricNumber-error" role="alert" className="text-sm text-destructive">
                {errors.matricNumber.message}
              </p>
            )}
          </div>

          {!isDeptAdmin && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cs-departmentId">Department</Label>
              <Controller
                name="departmentId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      setValue("programId", "");
                    }}
                  >
                    <SelectTrigger
                      id="cs-departmentId"
                      className="w-full"
                      aria-invalid={!!errors.departmentId}
                      aria-describedby={errors.departmentId ? "cs-departmentId-error" : undefined}
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
                <p id="cs-departmentId-error" role="alert" className="text-sm text-destructive">
                  {errors.departmentId.message}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cs-programId">Program</Label>
              <Controller
                name="programId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={!departmentId}>
                    <SelectTrigger
                      id="cs-programId"
                      className="w-full"
                      aria-invalid={!!errors.programId}
                      aria-describedby={errors.programId ? "cs-programId-error" : undefined}
                    >
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
              {errors.programId && (
                <p id="cs-programId-error" role="alert" className="text-sm text-destructive">
                  {errors.programId.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cs-level">Level</Label>
              <Controller
                name="level"
                control={control}
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger id="cs-level" className="w-full">
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
            <Button type="submit" disabled={createStudent.isPending}>
              Register student
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
