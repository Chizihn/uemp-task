import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Management",
  description: "Manage portal users, account statuses, and institutional roles",
};

export default function UsersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
