import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Departments",
  description: "Manage academic departments across faculties",
};

export default function DepartmentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
