import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Available Courses",
  description: "Browse and register for eligible courses in the current semester",
};

export default function AvailableCoursesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
