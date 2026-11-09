import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Academic Sessions",
  description: "Configure academic sessions and activate semesters",
};

export default function SessionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
