"use client";

import { FileBarChart } from "lucide-react";
import { usePerformanceSummary } from "@/hooks/use-reports";
import { useRequireRole } from "@/hooks/use-require-role";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";

export default function PerformancePage() {
  const { ready } = useRequireRole("LECTURER");
  const { data, isLoading } = usePerformanceSummary({});

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">Performance</h1>
        <p className="text-sm text-muted-foreground">
          Average scores and grade distribution across all your approved results.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course performance</CardTitle>
          <CardDescription>Based on approved (published) results only.</CardDescription>
        </CardHeader>
        <CardContent>
          {!ready || isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !data || data.length === 0 ? (
            <EmptyState
              icon={FileBarChart}
              title="No approved results yet"
              description="Performance data appears once a Department Admin approves your submitted results."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Students Graded</TableHead>
                  <TableHead>Average Score</TableHead>
                  <TableHead>Grade Distribution</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.course}>
                    <TableCell className="font-mono text-xs">{row.course}</TableCell>
                    <TableCell className="font-medium">{row.title}</TableCell>
                    <TableCell className="text-muted-foreground">{row.studentsGraded}</TableCell>
                    <TableCell className="text-muted-foreground">{row.averageScore}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(row.gradeDistribution).map(([grade, count]) => (
                          <Badge key={grade} variant="secondary">
                            {grade}: {count}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
