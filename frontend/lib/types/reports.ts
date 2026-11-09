export interface PeriodFilter {
  sessionId?: string;
  semesterId?: string;
}

export interface RegistrationSummaryRow {
  course: string;
  title: string;
  units: number;
  registered: number;
}

export interface PerformanceSummaryRow {
  course: string;
  title: string;
  studentsGraded: number;
  averageScore: number;
  gradeDistribution: Record<string, number>;
}
