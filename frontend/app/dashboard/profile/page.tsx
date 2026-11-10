"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCurrentUser, useUpdateMyProfile, useChangePassword } from "@/hooks/use-auth";
import { useRequireAuth } from "@/hooks/use-require-role";
import { AvatarUpload } from "@/components/shared/avatar-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_LABEL } from "@/lib/types";
import { formatName, initialsFromName } from "@/lib/utils";

const profileFormSchema = z.object({
  phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function ProfilePage() {
  const { ready } = useRequireAuth();
  const { data: user, isLoading } = useCurrentUser();
  const updateProfile = useUpdateMyProfile();
  const changePassword = useChangePassword();

  const { register, handleSubmit } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    values: { phone: user?.phone ?? "" },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  function onSubmit(values: ProfileFormValues) {
    updateProfile.mutate({ phone: values.phone || undefined });
  }

  function onPasswordSubmit(values: PasswordFormValues) {
    changePassword.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      { onSuccess: () => resetPasswordForm() },
    );
  }

  const identifier =
    user?.student?.matricNumber ?? user?.lecturer?.staffId ?? user?.deptAdminProfile?.department.name;
  const department =
    user?.student?.department.name ?? user?.lecturer?.department.name ?? user?.deptAdminProfile?.department.name;
  const initials = user ? initialsFromName(user) : "";

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">Profile Settings</h1>
        <p className="text-sm text-muted-foreground">
          Update the personal details you&apos;re permitted to change yourself.
        </p>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4">
          <AvatarUpload src={user?.avatarUrl} fallback={initials} />
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">{user ? formatName(user) : ""}</span>
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <span className="text-xs text-muted-foreground">
              Click your photo to change it (max 5MB)
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Managed by your institution — not editable here.</CardDescription>
        </CardHeader>
        <CardContent>
          {!ready || isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoField label="Name" value={user ? formatName(user) : undefined} />
              <InfoField label="Email" value={user?.email} />
              {user && user.role !== "STUDENT" && (
                <InfoField label="Role" value={ROLE_LABEL[user.role]} />
              )}
              {identifier && <InfoField label="Identifier" value={identifier} />}
              {department && <InfoField label="Department" value={department} />}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
          <CardDescription>Visible to administrators within your department.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone number</Label>
              <Input id="phone" placeholder="+234..." {...register("phone")} />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={updateProfile.isPending}>
              Save changes
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>
            Change your password — especially if you&apos;re still using the temporary one issued
            when your account was created.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="currentPassword">Current password</Label>
              <PasswordInput
                id="currentPassword"
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={!!passwordErrors.currentPassword}
                aria-describedby={passwordErrors.currentPassword ? "currentPassword-error" : undefined}
                {...registerPassword("currentPassword")}
              />
              {passwordErrors.currentPassword && (
                <p id="currentPassword-error" role="alert" className="text-sm text-destructive">
                  {passwordErrors.currentPassword.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="newPassword">New password</Label>
                <PasswordInput
                  id="newPassword"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  aria-invalid={!!passwordErrors.newPassword}
                  aria-describedby={passwordErrors.newPassword ? "newPassword-error" : undefined}
                  {...registerPassword("newPassword")}
                />
                {passwordErrors.newPassword && (
                  <p id="newPassword-error" role="alert" className="text-sm text-destructive">
                    {passwordErrors.newPassword.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <PasswordInput
                  id="confirmPassword"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  aria-invalid={!!passwordErrors.confirmPassword}
                  aria-describedby={passwordErrors.confirmPassword ? "confirmPassword-error" : undefined}
                  {...registerPassword("confirmPassword")}
                />
                {passwordErrors.confirmPassword && (
                  <p id="confirmPassword-error" role="alert" className="text-sm text-destructive">
                    {passwordErrors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={changePassword.isPending}>
              Change password
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium">{value ?? "—"}</span>
    </div>
  );
}
