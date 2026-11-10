"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRejectResult } from "@/hooks/use-results";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ResultWithRegistration } from "@/lib/types";

interface RejectResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result?: ResultWithRegistration;
}

export function RejectResultDialog({ open, onOpenChange, result }: RejectResultDialogProps) {
  const [reason, setReason] = useState("");
  const rejectResult = useRejectResult();

  function handleSubmit() {
    if (!result || reason.trim().length < 3) return;
    rejectResult.mutate(
      { id: result.id, reason: reason.trim() },
      {
        onSuccess: () => {
          setReason("");
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Return for correction</DialogTitle>
          <DialogDescription>
            {result?.registration.student.matricNumber} —{" "}
            {result?.registration.courseAllocation.course.code}. The lecturer will see this
            feedback and can resubmit.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reason">Feedback</Label>
            <Textarea
              id="reason"
              placeholder="e.g. Exam score looks too low for this student, please recheck the script"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              aria-describedby="reason-help"
            />
            <p id="reason-help" className="text-xs text-muted-foreground">
              Provide at least 3 characters explaining why this result needs correction.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              variant="destructive"
              disabled={reason.trim().length < 3 || rejectResult.isPending}
            >
              {rejectResult.isPending && <Loader2 className="size-4 animate-spin" />}
              Return for correction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
