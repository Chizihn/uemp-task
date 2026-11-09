import { Badge, type badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";
import type { ResultStatus, UserStatus } from "@/lib/types";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

const RESULT_STATUS_MAP: Record<ResultStatus, { label: string; variant: BadgeVariant }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  SUBMITTED: { label: "Submitted", variant: "default" },
  APPROVED: { label: "Approved", variant: "success" },
  REJECTED: { label: "Rejected", variant: "destructive" },
};

const USER_STATUS_MAP: Record<UserStatus, { label: string; variant: BadgeVariant }> = {
  ACTIVE: { label: "Active", variant: "success" },
  SUSPENDED: { label: "Suspended", variant: "warning" },
  INACTIVE: { label: "Inactive", variant: "secondary" },
};

export function ResultStatusBadge({ status }: { status: ResultStatus }) {
  const { label, variant } = RESULT_STATUS_MAP[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const { label, variant } = USER_STATUS_MAP[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? "success" : "secondary"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}
