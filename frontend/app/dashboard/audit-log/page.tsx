"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useAuditLog } from "@/hooks/use-audit-log";
import { useRequireRole } from "@/hooks/use-require-role";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { formatName } from "@/lib/utils";

const TAKE = 30;

export default function AuditLogPage() {
  const { ready } = useRequireRole("SUPER_ADMIN");
  const [action, setAction] = useState<string>("ALL");
  const [skip, setSkip] = useState(0);

  const { data, isLoading } = useAuditLog({
    action: action === "ALL" ? undefined : action,
    skip,
    take: TAKE,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">Audit Log</h1>
        <p className="text-sm text-muted-foreground">
          Every critical action — score entry, submissions, approvals, rejections, account
          changes — traced with timestamp and user identity.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
          <CardDescription>{data?.total ?? 0} total</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Select
            value={action}
            onValueChange={(v) => {
              setAction(v ?? "ALL");
              setSkip(0);
            }}
          >
            <SelectTrigger className="w-56" aria-label="Filter by action">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All actions</SelectItem>
              {AUDIT_ACTIONS.map((a) => (
                <SelectItem key={a.value} value={a.value}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {!ready || isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !data || data.items.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="No activity recorded yet" />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Metadata</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {entry.user ? formatName(entry.user) : "System"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{entry.action}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {entry.entityType}
                        {entry.entityId ? ` (${entry.entityId.slice(0, 8)}…)` : ""}
                      </TableCell>
                      <TableCell
                        className="max-w-48 truncate text-xs text-muted-foreground"
                        title={entry.metadata ? JSON.stringify(entry.metadata) : undefined}
                      >
                        {entry.metadata ? JSON.stringify(entry.metadata) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationControls
                skip={data.skip}
                take={data.take}
                total={data.total}
                onSkipChange={setSkip}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
