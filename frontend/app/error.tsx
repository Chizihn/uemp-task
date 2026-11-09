"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-6 text-destructive" />
      </div>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-xl font-medium">Something went wrong</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          An unexpected error occurred. Try again, or come back in a moment.
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
