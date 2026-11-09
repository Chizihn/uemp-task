import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Performance Reports",
  description: "View class performance statistics, average scores, and grade distributions",
};

export default function PerformanceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
