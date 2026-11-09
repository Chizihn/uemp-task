import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Grade Course",
  description: "Enter and submit student CA and exam scores for review",
};

export default function CourseGradingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
