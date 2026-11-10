"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAddSemester } from "@/hooks/use-academic-sessions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TERM_LABEL, type AcademicSession, type Term } from "@/lib/types";

const ALL_TERMS: Term[] = ["FIRST", "SECOND", "THIRD"];

interface AddSemesterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session?: AcademicSession;
}

export function AddSemesterDialog({ open, onOpenChange, session }: AddSemesterDialogProps) {
  const addSemester = useAddSemester();
  const [term, setTerm] = useState<Term | "">("");

  const usedTerms = new Set(session?.semesters.map((s) => s.term));
  const availableTerms = ALL_TERMS.filter((t) => !usedTerms.has(t));

  function handleSubmit() {
    if (!session || !term) return;
    addSemester.mutate(
      { sessionId: session.id, term },
      {
        onSuccess: () => {
          setTerm("");
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add semester</DialogTitle>
          <DialogDescription>
            Add a semester to {session?.name ?? "this session"}.
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
            <Label htmlFor="term">Term</Label>
            <Select value={term} onValueChange={(v) => setTerm(v as Term)}>
              <SelectTrigger id="term" className="w-full">
                <SelectValue placeholder="Select a term" />
              </SelectTrigger>
              <SelectContent>
                {availableTerms.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TERM_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableTerms.length === 0 && (
              <p className="text-sm text-muted-foreground">
                All terms have already been added to this session.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!term || addSemester.isPending}>
              {addSemester.isPending && <Loader2 className="size-4 animate-spin" />}
              Add semester
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
