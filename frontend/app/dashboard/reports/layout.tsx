import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reports",
  description: "Export registration and student performance summaries as PDF reports",
};

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
