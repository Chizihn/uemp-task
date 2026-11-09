import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Results & CGPA",
  description: "View semester grades, GPAs, and cumulative grade point average (CGPA)",
};

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
