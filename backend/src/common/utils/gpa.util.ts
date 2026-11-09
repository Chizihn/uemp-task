export interface UnitsGradePoint {
  units: number;
  gradePoint: number;
}

/**
 * Standard credit-unit-weighted GPA: Σ(units × gradePoint) / Σ(units).
 * Used for both a single semester's GPA and the running CGPA (pass every
 * approved result across sessions for the latter). Returns 0 for an empty
 * result set rather than NaN.
 */
export function calculateGpa(rows: UnitsGradePoint[]): number {
  const totalUnits = rows.reduce((sum, r) => sum + r.units, 0);
  if (totalUnits === 0) {
    return 0;
  }
  const totalPoints = rows.reduce((sum, r) => sum + r.units * r.gradePoint, 0);
  return Math.round((totalPoints / totalUnits) * 100) / 100;
}
