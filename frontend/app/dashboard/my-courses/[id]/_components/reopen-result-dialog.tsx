"use client";

import { useState } from "react";
import { useReopenResult } from "@/hooks/use-results";
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

interface ReopenResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resultId?: string;
}

export function ReopenResultDialog({ open, onOpenChange, resultId }: ReopenResultDialogProps) {
  const [reason, setReason] = useState("");
  const reopenResult = useReopenResult();

  function handleSubmit() {
    if (!resultId) return;
    reopenResult.mutate(
      { id: resultId, reason: reason.trim() || undefined },
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
          <DialogTitle>Reopen this result?</DialogTitle>
          <DialogDescription>
            Unlocks this published result back to draft so the lecturer can correct and resubmit
            it. It stops counting toward the student&apos;s CGPA until approved again.
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
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="e.g. Found a transcription error, needs recheck"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={reopenResult.isPending}>
              Reopen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
