import type { ResultStatus, Term } from "@/lib/types/common";
import type { RegistrationWithStudent } from "@/lib/types/registration";

export interface Result {
  id: string;
  registrationId: string;
  caScore: number | null;
  examScore: number | null;
  totalScore: number | null;
  grade: string | null;
  gradePoint: number | null;
  status: ResultStatus;
  rejectionReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
}

/** A result row as returned by `/results/pending` and `/results/my-submissions`. */
export interface ResultWithRegistration extends Result {
  registration: RegistrationWithStudent;
}

export interface MyResultsSemesterGroup {
  session: string;
  semester: Term;
  results: ResultWithRegistration[];
  gpa: number;
}

/** Shape of `GET /results/me`. */
export interface MyResultsResponse {
  semesters: MyResultsSemesterGroup[];
  cgpa: number;
}

export interface SaveDraftInput {
  caScore?: number;
  examScore?: number;
}

export interface PendingResultsFilters {
  courseAllocationId?: string;
  search?: string;
  skip?: number;
  take?: number;
}
