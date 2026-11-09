import type { Role } from "@/lib/types/common";

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    email: string;
    role: Role;
  } | null;
}

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  entityType?: string;
  skip?: number;
  take?: number;
}
