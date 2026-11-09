"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, RotateCcw, Save, Send, Users } from "lucide-react";
import { useClassList, useSaveDraft, useSubmitResult } from "@/hooks/use-results";
import { useRequireRole } from "@/hooks/use-require-role";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ResultStatusBadge } from "@/components/shared/status-badge";
import { ReopenResultDialog } from "./_components/reopen-result-dialog";
import { formatName } from "@/lib/utils";
import type { ClassList } from "@/lib/types";

export default function ClassListPage() {
  const { ready, user } = useRequireRole(["LECTURER", "DEPT_ADMIN", "SUPER_ADMIN"]);
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useClassList(id);
  const [reopeningResultId, setReopeningResultId] = useState<string | undefined>();

  const isLecturer = user?.role === "LECTURER";
  const backHref = isLecturer ? "/dashboard/my-courses" : "/dashboard/courses";
  const backLabel = isLecturer ? "My Courses" : "Courses";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          nativeButton={false}
          render={<Link href={backHref} />}
        >
          <ArrowLeft className="size-3.5" />
          Back to {backLabel}
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-medium">
            {data?.allocation.course.code ?? "Class List"}
          </h1>
          <p className="text-sm text-muted-foreground">{data?.allocation.course.title}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered students</CardTitle>
          <CardDescription>
            {isLecturer
              ? "Enter CA (0–30) and exam (0–70) scores, save as draft, then submit for departmental review."
              : "Read-only — scores are entered by the assigned lecturer. Approved results can be reopened for correction here."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!ready || isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !data || data.registrations.length === 0 ? (
            <EmptyState icon={Users} title="No students registered for this course yet" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matric Number</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-24">CA (30)</TableHead>
                  <TableHead className="w-24">Exam (70)</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.registrations.map((registration) => (
                  <ClassListRow
                    key={registration.id}
                    registration={registration}
                    isLecturer={isLecturer}
                    onReopen={(resultId) => setReopeningResultId(resultId)}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ReopenResultDialog
        open={!!reopeningResultId}
        onOpenChange={(open) => !open && setReopeningResultId(undefined)}
        resultId={reopeningResultId}
      />
    </div>
  );
}

function ClassListRow({
  registration,
  isLecturer,
  onReopen,
}: {
  registration: ClassList["registrations"][number];
  isLecturer: boolean;
  onReopen: (resultId: string) => void;
}) {
  const result = registration.result;
  const editable = isLecturer && (!result || result.status === "DRAFT" || result.status === "REJECTED");

  const [caScore, setCaScore] = useState<string>(result?.caScore?.toString() ?? "");
  const [examScore, setExamScore] = useState<string>(result?.examScore?.toString() ?? "");

  const saveDraft = useSaveDraft();
  const submitResult = useSubmitResult();

  const caNum = caScore === "" ? undefined : Number(caScore);
  const examNum = examScore === "" ? undefined : Number(examScore);
  const canSubmit = isLecturer && result?.status === "DRAFT" && caNum !== undefined && examNum !== undefined;

  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{registration.student.matricNumber}</TableCell>
      <TableCell className="font-medium">{formatName(registration.student.user)}</TableCell>
      <TableCell>
        {isLecturer ? (
          <Input
            type="number"
            min={0}
            max={30}
            className="h-8 w-20"
            value={caScore}
            disabled={!editable}
            aria-label={`CA score for ${registration.student.matricNumber}`}
            onChange={(e) => setCaScore(e.target.value)}
          />
        ) : (
          <span className="text-muted-foreground">{result?.caScore ?? "—"}</span>
        )}
      </TableCell>
      <TableCell>
        {isLecturer ? (
          <Input
            type="number"
            min={0}
            max={70}
            className="h-8 w-20"
            value={examScore}
            disabled={!editable}
            aria-label={`Exam score for ${registration.student.matricNumber}`}
            onChange={(e) => setExamScore(e.target.value)}
          />
        ) : (
          <span className="text-muted-foreground">{result?.examScore ?? "—"}</span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">{result?.totalScore ?? "—"}</TableCell>
      <TableCell className="text-muted-foreground">{result?.grade ?? "—"}</TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          {result ? (
            <ResultStatusBadge status={result.status} />
          ) : (
            <span className="text-xs text-muted-foreground">Not started</span>
          )}
          {result?.status === "REJECTED" && result.rejectionReason && (
            <span className="max-w-48 text-xs text-destructive">{result.rejectionReason}</span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        {isLecturer ? (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={
                !editable || caNum === undefined || examNum === undefined || saveDraft.isPending
              }
              onClick={() =>
                saveDraft.mutate({
                  registrationId: registration.id,
                  caScore: caNum,
                  examScore: examNum,
                })
              }
              title="Save draft"
            >
              <Save className="size-3.5" />
              <span className="sr-only">Save draft for {registration.student.matricNumber}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={!canSubmit || submitResult.isPending}
              onClick={() => submitResult.mutate(registration.id)}
              title="Submit for review"
            >
              <Send className="size-3.5" />
              <span className="sr-only">Submit result for {registration.student.matricNumber}</span>
            </Button>
          </div>
        ) : (
          result?.status === "APPROVED" && (
            <Button variant="ghost" size="sm" onClick={() => onReopen(result.id)}>
              <RotateCcw className="size-3.5" /> Reopen
              <span className="sr-only"> result for {registration.student.matricNumber}</span>
            </Button>
          )
        )}
      </TableCell>
    </TableRow>
  );
}
