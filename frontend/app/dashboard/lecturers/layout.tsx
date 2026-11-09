import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lecturers",
  description: "View and manage department lecturers and academic staff",
};

export default function LecturersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
