import type { LucideIcon } from "lucide-react";
import { cn } from "cn";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/** Drop into any list/table view in place of an empty array. */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3.5 rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-14 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="flex size-12 items-center justify-center rounded-full bg-muted/80 text-muted-foreground shadow-xs">
          <Icon className="size-6 text-muted-foreground/80" />
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <p className="font-heading text-base md:text-lg font-semibold tracking-tight text-foreground">{title}</p>
        {description && <p className="max-w-md text-sm text-muted-foreground leading-normal">{description}</p>}
      </div>
      {action}
    </div>
  );
}
