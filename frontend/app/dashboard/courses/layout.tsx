import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Courses",
  description: "Browse course catalog, manage course details, and assign lecturers",
};

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
