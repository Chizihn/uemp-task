"use client";

import { GraduationCap, Printer } from "lucide-react";
import { useMyResults } from "@/hooks/use-results";
import { useRequireRole } from "@/hooks/use-require-role";
import { Button } from "@/components/ui/button";
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
import { TERM_LABEL } from "@/lib/types";
import { formatName } from "@/lib/utils";

export default function ResultsPage() {
  const { ready, user } = useRequireRole("STUDENT");
  const { data, isLoading } = useMyResults();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="font-heading text-2xl font-medium">Results</h1>
          <p className="text-sm text-muted-foreground">
            Only approved results count toward your academic record.
          </p>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="size-4" /> Print statement
        </Button>
      </div>

      <div className="hidden flex-col gap-1 print:flex">
        <h1 className="font-heading text-xl font-medium">Statement of Results</h1>
        <p className="text-sm text-muted-foreground">
          {user ? formatName(user) : ""} — {user?.student?.matricNumber}
        </p>
      </div>

      {!ready || isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : !data || data.semesters.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={GraduationCap}
              title="No approved results yet"
              description="Results appear here once your Department Admin approves them."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card size="sm">
            <CardContent className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Cumulative GPA (CGPA)</span>
              <span className="font-heading text-3xl font-medium">{data.cgpa.toFixed(2)}</span>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            {data.semesters.map((group) => (
              <Card key={`${group.session}-${group.semester}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>
                      {group.session} — {TERM_LABEL[group.semester]}
                    </span>
                    <span className="text-base text-muted-foreground">
                      GPA: {group.gpa.toFixed(2)}
                    </span>
                  </CardTitle>
                  <CardDescription>{group.results.length} course(s)</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Units</TableHead>
                        <TableHead>CA</TableHead>
                        <TableHead>Exam</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Grade Point</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.results.map((result) => {
                        const course = result.registration.courseAllocation.course;
                        return (
                          <TableRow key={result.id}>
                            <TableCell className="font-mono text-xs">{course.code}</TableCell>
                            <TableCell className="font-medium">{course.title}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {course.units}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {result.caScore}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {result.examScore}
                            </TableCell>
                            <TableCell className="font-medium">{result.totalScore}</TableCell>
                            <TableCell className="text-muted-foreground">{result.grade}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {result.gradePoint}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
