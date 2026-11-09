import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Courses",
  description: "View allocated teaching courses and grade enrolled students",
};

export default function MyCoursesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
