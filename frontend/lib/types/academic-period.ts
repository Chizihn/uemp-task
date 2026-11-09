import type { Term } from "@/lib/types/common";

export interface Semester {
  id: string;
  sessionId: string;
  term: Term;
  isActive: boolean;
}

export interface AcademicSession {
  id: string;
  name: string;
  isActive: boolean;
  semesters: Semester[];
}

/** Shape of `GET /academic-sessions/active` — a session without its full semester list. */
export interface ActivePeriod {
  session: Omit<AcademicSession, "semesters">;
  semester: Semester;
}
