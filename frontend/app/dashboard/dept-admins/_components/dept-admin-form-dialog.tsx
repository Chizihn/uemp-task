"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { deptAdminFormSchema, type DeptAdminFormValues } from "@/lib/validations/dept-admin";
import { useCreateDeptAdmin } from "@/hooks/use-dept-admins";
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
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DeptAdminFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeptAdminFormDialog({ open, onOpenChange }: DeptAdminFormDialogProps) {
  const { data: departments } = useDepartments();
  const createDeptAdmin = useCreateDeptAdmin();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DeptAdminFormValues>({
    resolver: zodResolver(deptAdminFormSchema),
    defaultValues: { firstName: "", middleName: "", lastName: "", email: "", password: "", departmentId: "" },
  });

  function onSubmit(values: DeptAdminFormValues) {
    createDeptAdmin.mutate(values, {
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
          <DialogTitle>New department admin</DialogTitle>
          <DialogDescription>
            Create an account scoped to manage a single department.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="da-firstName">First name</Label>
              <Input
                id="da-firstName"
                aria-invalid={!!errors.firstName}
                aria-describedby={errors.firstName ? "da-firstName-error" : undefined}
                {...register("firstName")}
              />
              {errors.firstName && (
                <p id="da-firstName-error" role="alert" className="text-sm text-destructive">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="da-middleName">Middle name</Label>
              <Input id="da-middleName" {...register("middleName")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="da-lastName">Last name</Label>
              <Input
                id="da-lastName"
                aria-invalid={!!errors.lastName}
                aria-describedby={errors.lastName ? "da-lastName-error" : undefined}
                {...register("lastName")}
              />
              {errors.lastName && (
                <p id="da-lastName-error" role="alert" className="text-sm text-destructive">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="da-email">Email</Label>
            <Input
              id="da-email"
              type="email"
              placeholder="admin@uemp.test"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "da-email-error" : undefined}
              {...register("email")}
            />
            {errors.email && (
              <p id="da-email-error" role="alert" className="text-sm text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="da-password">Temporary password</Label>
            <PasswordInput
              id="da-password"
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "da-password-error" : undefined}
              {...register("password")}
            />
            {errors.password && (
              <p id="da-password-error" role="alert" className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="da-departmentId">Department</Label>
            <Controller
              name="departmentId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="da-departmentId"
                    className="w-full"
                    aria-invalid={!!errors.departmentId}
                    aria-describedby={errors.departmentId ? "da-dept-error" : undefined}
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
              <p id="da-dept-error" role="alert" className="text-sm text-destructive">
                {errors.departmentId.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createDeptAdmin.isPending}>
              Create department admin
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
