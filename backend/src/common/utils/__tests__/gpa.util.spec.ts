import { calculateGpa } from '../gpa.util';

describe('calculateGpa', () => {
  it('returns 0 when no rows are passed', () => {
    expect(calculateGpa([])).toBe(0);
  });

  it('calculates GPA correctly for a single course', () => {
    const rows = [{ units: 3, gradePoint: 5 }];
    expect(calculateGpa(rows)).toBe(5);
  });

  it('calculates weighted GPA correctly for multiple courses matching seed scenario', () => {
    // CSC301 (3 units, A = 5 GP) + CSC302 (3 units, B = 4 GP)
    // (3*5 + 3*4) / (3+3) = 27 / 6 = 4.50
    const rows = [
      { units: 3, gradePoint: 5 },
      { units: 3, gradePoint: 4 },
    ];
    expect(calculateGpa(rows)).toBe(4.5);
  });

  it('handles fractional GPAs with rounding to 2 decimal places', () => {
    // 3 units with 5 GP + 2 units with 4 GP = (15 + 8) / 5 = 23 / 5 = 4.60
    const rows = [
      { units: 3, gradePoint: 5 },
      { units: 2, gradePoint: 4 },
    ];
    expect(calculateGpa(rows)).toBe(4.6);
  });
});
