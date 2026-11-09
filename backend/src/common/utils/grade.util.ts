export interface GradingScaleRow {
  minScore: number;
  maxScore: number;
  grade: string;
  gradePoint: number;
}

/** Default 5-point scale (business rule §6.9), used to seed `grading_scale`. */
export const DEFAULT_GRADING_SCALE: GradingScaleRow[] = [
  { minScore: 70, maxScore: 100, grade: 'A', gradePoint: 5 },
  { minScore: 60, maxScore: 69, grade: 'B', gradePoint: 4 },
  { minScore: 50, maxScore: 59, grade: 'C', gradePoint: 3 },
  { minScore: 45, maxScore: 49, grade: 'D', gradePoint: 2 },
  { minScore: 40, maxScore: 44, grade: 'E', gradePoint: 1 },
  { minScore: 0, maxScore: 39, grade: 'F', gradePoint: 0 },
];

/**
 * Resolves a total score (0-100) to its letter grade + grade point against a
 * grading scale loaded from the DB (never hardcoded at the call site, so the
 * scale stays admin-configurable per business rule §6.9).
 */
export function resolveGrade(
  totalScore: number,
  scale: GradingScaleRow[] = DEFAULT_GRADING_SCALE,
): { grade: string; gradePoint: number } {
  const row = scale.find((r) => totalScore >= r.minScore && totalScore <= r.maxScore);
  if (!row) {
    throw new Error(`No grading scale row covers score ${totalScore}`);
  }
  return { grade: row.grade, gradePoint: row.gradePoint };
}
