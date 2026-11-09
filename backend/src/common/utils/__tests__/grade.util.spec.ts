import { resolveGrade, DEFAULT_GRADING_SCALE } from '../grade.util';

describe('resolveGrade', () => {
  it('resolves score 78 to A with 5 grade points', () => {
    const res = resolveGrade(78);
    expect(res).toEqual({ grade: 'A', gradePoint: 5 });
  });

  it('resolves score 65 to B with 4 grade points', () => {
    const res = resolveGrade(65);
    expect(res).toEqual({ grade: 'B', gradePoint: 4 });
  });

  it('resolves boundary scores correctly across the 5-point scale', () => {
    expect(resolveGrade(100)).toEqual({ grade: 'A', gradePoint: 5 });
    expect(resolveGrade(70)).toEqual({ grade: 'A', gradePoint: 5 });
    expect(resolveGrade(69)).toEqual({ grade: 'B', gradePoint: 4 });
    expect(resolveGrade(60)).toEqual({ grade: 'B', gradePoint: 4 });
    expect(resolveGrade(59)).toEqual({ grade: 'C', gradePoint: 3 });
    expect(resolveGrade(50)).toEqual({ grade: 'C', gradePoint: 3 });
    expect(resolveGrade(49)).toEqual({ grade: 'D', gradePoint: 2 });
    expect(resolveGrade(45)).toEqual({ grade: 'D', gradePoint: 2 });
    expect(resolveGrade(44)).toEqual({ grade: 'E', gradePoint: 1 });
    expect(resolveGrade(40)).toEqual({ grade: 'E', gradePoint: 1 });
    expect(resolveGrade(39)).toEqual({ grade: 'F', gradePoint: 0 });
    expect(resolveGrade(0)).toEqual({ grade: 'F', gradePoint: 0 });
  });

  it('throws an error for scores outside the grading scale bounds', () => {
    expect(() => resolveGrade(101)).toThrow('No grading scale row covers score 101');
    expect(() => resolveGrade(-1)).toThrow('No grading scale row covers score -1');
  });

  it('supports custom configurable grading scale', () => {
    const customScale = [
      { minScore: 50, maxScore: 100, grade: 'PASS', gradePoint: 1 },
      { minScore: 0, maxScore: 49, grade: 'FAIL', gradePoint: 0 },
    ];
    expect(resolveGrade(55, customScale)).toEqual({ grade: 'PASS', gradePoint: 1 });
    expect(resolveGrade(30, customScale)).toEqual({ grade: 'FAIL', gradePoint: 0 });
  });
});
