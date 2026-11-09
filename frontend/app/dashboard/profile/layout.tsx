import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description: "View and update your personal portal profile and account credentials",
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
