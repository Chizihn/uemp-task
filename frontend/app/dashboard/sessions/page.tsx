"use client";

import { useState } from "react";
import { CalendarRange, Plus } from "lucide-react";
import {
  useAcademicSessions,
  useActivateSemester,
  useActivateSession,
} from "@/hooks/use-academic-sessions";
import { useRequireRole } from "@/hooks/use-require-role";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { SessionFormDialog } from "./_components/session-form-dialog";
import { AddSemesterDialog } from "./_components/add-semester-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TERM_LABEL, type AcademicSession } from "@/lib/types";

type PendingActivation =
  | { type: "session"; id: string; label: string }
  | { type: "semester"; id: string; label: string };

export default function AcademicSessionsPage() {
  const { ready } = useRequireRole("SUPER_ADMIN");
  const { data: sessions, isLoading } = useAcademicSessions();
  const activateSession = useActivateSession();
  const activateSemester = useActivateSemester();

  const [createOpen, setCreateOpen] = useState(false);
  const [semesterDialog, setSemesterDialog] = useState<{ open: boolean; session?: AcademicSession }>({
    open: false,
  });
  const [pending, setPending] = useState<PendingActivation | null>(null);

  function confirmActivation() {
    if (!pending) return;
    if (pending.type === "session") {
      activateSession.mutate(pending.id, { onSuccess: () => setPending(null) });
    } else {
      activateSemester.mutate(pending.id, { onSuccess: () => setPending(null) });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-medium">Academic Sessions</h1>
          <p className="text-sm text-muted-foreground">
            Exactly one session and one semester are active university-wide at a time.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> New session
        </Button>
      </div>

      {!ready || isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : !sessions || sessions.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={CalendarRange}
              title="No academic sessions yet"
              description="Create the first session, then add its semesters."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {session.name}
                  {session.isActive && <Badge variant="success">Active</Badge>}
                </CardTitle>
                <CardDescription>
                  {session.semesters.length} semester{session.semesters.length === 1 ? "" : "s"}
                </CardDescription>
                <CardAction className="flex gap-2">
                  {!session.isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPending({ type: "session", id: session.id, label: session.name })
                      }
                    >
                      Activate
                      <span className="sr-only"> session {session.name}</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSemesterDialog({ open: true, session })}
                  >
                    <Plus className="size-3.5" /> Semester
                    <span className="sr-only"> to {session.name}</span>
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                {session.semesters.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No semesters added yet.</p>
                ) : (
                  <div className="flex flex-col divide-y divide-border">
                    {session.semesters.map((semester) => (
                      <div
                        key={semester.id}
                        className="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{TERM_LABEL[semester.term]}</span>
                          {semester.isActive && <Badge variant="success">Active</Badge>}
                        </div>
                        {!semester.isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setPending({
                                type: "semester",
                                id: semester.id,
                                label: `${TERM_LABEL[semester.term]} (${session.name})`,
                              })
                            }
                          >
                            Activate
                            <span className="sr-only">
                              {" "}
                              semester {TERM_LABEL[semester.term]} of {session.name}
                            </span>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SessionFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <AddSemesterDialog
        open={semesterDialog.open}
        onOpenChange={(open) => setSemesterDialog((s) => ({ ...s, open }))}
        session={semesterDialog.session}
      />

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(open) => !open && setPending(null)}
        title={`Activate ${pending?.label}?`}
        description={`This becomes the current ${pending?.type} university-wide, and deactivates whichever one is currently active. Students will immediately see it as the current period for registration.`}
        confirmLabel="Activate"
        isPending={activateSession.isPending || activateSemester.isPending}
        onConfirm={confirmActivation}
      />
    </div>
  );
}
