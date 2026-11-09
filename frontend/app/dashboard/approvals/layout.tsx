import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Result Approvals",
  description: "Review, approve, or reject submitted student results",
};

export default function ApprovalsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
