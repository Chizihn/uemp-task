import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Department Admins",
  description: "Manage department administrators and reassign departmental authority",
};

export default function DeptAdminsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
