import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audit Log",
  description: "Review system audit trails and administrative security actions",
};

export default function AuditLogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
