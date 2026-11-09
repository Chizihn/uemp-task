import type { Metadata } from "next";
import { DashboardClientLayout } from "./dashboard-client-layout";

export const metadata: Metadata = {
  title: {
    default: "Dashboard",
    template: "%s | UEMP",
  },
  description: "University Education Management Portal dashboard overview",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardClientLayout>{children}</DashboardClientLayout>;
}
