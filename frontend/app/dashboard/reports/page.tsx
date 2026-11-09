"use client";

import { FileBarChart } from "lucide-react";
import { useRegistrationSummary, usePerformanceSummary } from "@/hooks/use-reports";
import { useActivePeriod } from "@/hooks/use-academic-sessions";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { TERM_LABEL } from "@/lib/types";

export default function ReportsPage() {
  const { ready } = useRequireRole(["SUPER_ADMIN", "DEPT_ADMIN"]);
  const { data: activePeriod } = useActivePeriod();

  const periodFilter = {
    sessionId: activePeriod?.session.id,
    semesterId: activePeriod?.semester.id,
  };

  const { data: registrationSummary, isLoading: loadingRegistrations } =
    useRegistrationSummary(periodFilter);
  const { data: performanceSummary, isLoading: loadingPerformance } =
    usePerformanceSummary(periodFilter);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">Reports</h1>
        <p className="text-sm text-muted-foreground">
          {activePeriod
            ? `${activePeriod.session.name} — ${TERM_LABEL[activePeriod.semester.term]}`
            : "No active semester configured yet"}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="registrations">
            <TabsList>
              <TabsTrigger value="registrations">Registration Summary</TabsTrigger>
              <TabsTrigger value="performance">Performance Summary</TabsTrigger>
            </TabsList>

            <TabsContent value="registrations" className="pt-4">
              <CardHeader className="px-0 pt-0">
                <CardTitle>Registrations per course</CardTitle>
                <CardDescription>How many students registered for each course.</CardDescription>
              </CardHeader>
              {!ready || loadingRegistrations ? (
                <div className="flex flex-col gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : !registrationSummary || registrationSummary.length === 0 ? (
                <EmptyState icon={FileBarChart} title="No registrations yet this semester" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Units</TableHead>
                      <TableHead>Registered</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrationSummary.map((row) => (
                      <TableRow key={row.course}>
                        <TableCell className="font-mono text-xs">{row.course}</TableCell>
                        <TableCell className="font-medium">{row.title}</TableCell>
                        <TableCell className="text-muted-foreground">{row.units}</TableCell>
                        <TableCell className="text-muted-foreground">{row.registered}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="performance" className="pt-4">
              <CardHeader className="px-0 pt-0">
                <CardTitle>Performance per course</CardTitle>
                <CardDescription>Based on approved (published) results only.</CardDescription>
              </CardHeader>
              {!ready || loadingPerformance ? (
                <div className="flex flex-col gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : !performanceSummary || performanceSummary.length === 0 ? (
                <EmptyState icon={FileBarChart} title="No approved results yet this semester" />
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
                    {performanceSummary.map((row) => (
                      <TableRow key={row.course}>
                        <TableCell className="font-mono text-xs">{row.course}</TableCell>
                        <TableCell className="font-medium">{row.title}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.studentsGraded}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.averageScore}
                        </TableCell>
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
