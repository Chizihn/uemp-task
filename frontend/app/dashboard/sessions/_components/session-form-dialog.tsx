"use client";

import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sessionFormSchema, type SessionFormValues } from "@/lib/validations/academic-session";
import { useCreateSession } from "@/hooks/use-academic-sessions";
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

interface SessionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SessionFormDialog({ open, onOpenChange }: SessionFormDialogProps) {
  const createSession = useCreateSession();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: { name: "" },
  });

  function onSubmit(values: SessionFormValues) {
    createSession.mutate(values, {
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
          <DialogTitle>New academic session</DialogTitle>
          <DialogDescription>
            Sessions aren&apos;t editable once created — double-check the name.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="session-name">Session name</Label>
            <Input
              id="session-name"
              placeholder="2025/2026"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "session-name-error" : undefined}
              {...register("name")}
            />
            {errors.name && (
              <p id="session-name-error" role="alert" className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createSession.isPending}>
              {createSession.isPending && <Loader2 className="size-4 animate-spin" />}
              Create session
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
