import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function InfoCard({ label, value }: { label: string; value?: string }) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        {value === undefined ? (
          <Skeleton className="h-6 w-20" />
        ) : (
          <span className="font-heading text-lg font-semibold tracking-tight text-foreground truncate">{value}</span>
        )}
      </CardContent>
    </Card>
  );
}

export function StatCard({
  label,
  value,
  isLoading,
}: {
  label: string;
  value?: number;
  isLoading?: boolean;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        {isLoading ? (
          <Skeleton className="h-8 w-12" />
        ) : (
          <span className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            {value ?? "—"}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
