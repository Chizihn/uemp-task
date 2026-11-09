import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Registrations",
  description: "View and manage semester course registrations",
};

export default function RegistrationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
