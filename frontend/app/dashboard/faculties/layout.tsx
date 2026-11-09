import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Faculties",
  description: "Manage university faculties",
};

export default function FacultiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
