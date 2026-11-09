import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Programs",
  description: "Manage degree and study programs",
};

export default function ProgramsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
