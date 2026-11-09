import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your University Education Management Portal account",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/30 p-6">
      <div className="flex items-center gap-2 font-heading text-xl font-medium">
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-sm text-brand-foreground">
          U
        </span>
        UEMP Portal
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
