import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Students",
  description: "View and manage student profiles and academic levels",
};

export default function StudentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
