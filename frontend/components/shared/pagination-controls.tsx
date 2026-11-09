import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationControlsProps {
  skip: number;
  take: number;
  total: number;
  onSkipChange: (skip: number) => void;
}

/** Reused by every paginated list (Users, Students, Lecturers, Courses, Audit Log, ...). */
export function PaginationControls({ skip, take, total, onSkipChange }: PaginationControlsProps) {
  if (total === 0) return null;

  const from = skip + 1;
  const to = Math.min(skip + take, total);
  const canPrev = skip > 0;
  const canNext = to < total;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4 pt-2">
      <p className="text-sm text-muted-foreground">
        {from}–{to} of {total}
      </p>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          disabled={!canPrev}
          onClick={() => onSkipChange(Math.max(0, skip - take))}
        >
          <ChevronLeft className="size-4" />
          <span className="sr-only">Previous page</span>
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          disabled={!canNext}
          onClick={() => onSkipChange(skip + take)}
        >
          <ChevronRight className="size-4" />
          <span className="sr-only">Next page</span>
        </Button>
      </div>
    </nav>
  );
}
