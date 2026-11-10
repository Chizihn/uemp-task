"use client";

import { useState } from "react";
import { CheckSquare, Search } from "lucide-react";
import { usePendingResults, useApproveResult } from "@/hooks/use-results";
import { useRequireRole } from "@/hooks/use-require-role";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
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
import { PaginationControls } from "@/components/shared/pagination-controls";
import { RejectResultDialog } from "./_components/reject-result-dialog";
import { formatName } from "@/lib/utils";
import type { ResultWithRegistration } from "@/lib/types";

const TAKE = 20;

export default function ApprovalsPage() {
  const { ready } = useRequireRole(["SUPER_ADMIN", "DEPT_ADMIN"]);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [skip, setSkip] = useState(0);
  const [rejecting, setRejecting] = useState<ResultWithRegistration | undefined>();

  const { data, isLoading } = usePendingResults({
    search: debouncedSearch || undefined,
    skip,
    take: TAKE,
  });
  const approveResult = useApproveResult();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">Result Approvals</h1>
        <p className="text-sm text-muted-foreground">
          Submissions awaiting departmental review. Approving publishes the result immediately.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending review</CardTitle>
          <CardDescription>{data?.total ?? 0} total</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {(search || (data?.total ?? 0) > 0 || isLoading) && (
            <div className="relative max-w-sm">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search by matric number or email..."
                aria-label="Search by matric number or email"
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSkip(0);
                }}
              />
            </div>
          )}

          {!ready || isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !data || data.items.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title={search ? "No results match your search" : "Nothing pending review"}
              description={
                search
                  ? "Try a different matric number or email."
                  : "Every submitted result has been reviewed. New submissions will show up here."
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matric Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>CA</TableHead>
                    <TableHead>Exam</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((result) => {
                    const registration = result.registration;
                    return (
                      <TableRow key={result.id}>
                        <TableCell className="font-mono text-xs">
                          {registration.student.matricNumber}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatName(registration.student.user)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {registration.courseAllocation.course.code}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{result.caScore}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {result.examScore}
                        </TableCell>
                        <TableCell className="font-medium">{result.totalScore}</TableCell>
                        <TableCell className="text-muted-foreground">{result.grade}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRejecting(result)}
                            >
                              Reject
                              <span className="sr-only">
                                {" "}
                                result for {registration.student.matricNumber} (
                                {registration.courseAllocation.course.code})
                              </span>
                            </Button>
                            <Button
                              size="sm"
                              disabled={approveResult.isPending}
                              onClick={() => approveResult.mutate(result.id)}
                            >
                              Approve
                              <span className="sr-only">
                                {" "}
                                result for {registration.student.matricNumber} (
                                {registration.courseAllocation.course.code})
                              </span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <PaginationControls
                skip={data.skip}
                take={data.take}
                total={data.total}
                onSkipChange={setSkip}
              />
            </>
          )}
        </CardContent>
      </Card>

      <RejectResultDialog
        open={!!rejecting}
        onOpenChange={(open) => !open && setRejecting(undefined)}
        result={rejecting}
      />
    </div>
  );
}
