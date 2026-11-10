"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Search, Users as UsersIcon } from "lucide-react";
import { useUsers, useUpdateUserStatus } from "@/hooks/use-users";
import { useRequireRole } from "@/hooks/use-require-role";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { UserStatusBadge } from "@/components/shared/status-badge";
import { ROLE_LABEL, type Role, type UserListItem, type UserStatus } from "@/lib/types";

const TAKE = 20;
const ALL_STATUSES: UserStatus[] = ["ACTIVE", "SUSPENDED", "INACTIVE"];
/** Super Admin accounts are bootstrapped out-of-band — they're never listed or filterable here. */
const FILTERABLE_ROLES = (Object.keys(ROLE_LABEL) as Role[]).filter((r) => r !== "SUPER_ADMIN");

export default function UsersPage() {
  const { ready } = useRequireRole("SUPER_ADMIN");

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [role, setRole] = useState<Role | "ALL">("ALL");
  const [status, setStatus] = useState<UserStatus | "ALL">("ALL");
  const [skip, setSkip] = useState(0);

  const { data, isLoading } = useUsers({
    search: debouncedSearch || undefined,
    role: role === "ALL" ? undefined : role,
    status: status === "ALL" ? undefined : status,
    skip,
    take: TAKE,
  });
  const updateStatus = useUpdateUserStatus();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">Users</h1>
        <p className="text-sm text-muted-foreground">
          Students, lecturers, and department admins — department admin accounts are created from{" "}
          <Link href="/dashboard/dept-admins" className="underline hover:text-foreground">
            Department Admins
          </Link>
          .
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All users</CardTitle>
          <CardDescription>{data?.total ?? 0} total</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-48 flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search by email..."
                aria-label="Search users by email"
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSkip(0);
                }}
              />
            </div>
            <Select
              value={role}
              onValueChange={(v) => {
                setRole(v as Role | "ALL");
                setSkip(0);
              }}
            >
              <SelectTrigger className="w-40" aria-label="Filter by role">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All roles</SelectItem>
                {FILTERABLE_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v as UserStatus | "ALL");
                setSkip(0);
              }}
            >
              <SelectTrigger className="w-40" aria-label="Filter by status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!ready || isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !data || data.items.length === 0 ? (
            <EmptyState
              icon={UsersIcon}
              title="No users match these filters"
              description="Try clearing the search or filters."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Identifier</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      onChangeStatus={(s) => updateStatus.mutate({ id: user.id, status: s })}
                    />
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

function UserRow({
  user,
  onChangeStatus,
}: {
  user: UserListItem;
  onChangeStatus: (status: UserStatus) => void;
}) {
  const identifier = user.student?.matricNumber ?? user.lecturer?.staffId ?? "—";
  const department =
    user.student?.department.name ??
    user.lecturer?.department.name ??
    user.deptAdminProfile?.department.name ??
    "—";

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex flex-col">
          <span>{formatName(user)}</span>
          <span className="text-xs text-muted-foreground">{user.email}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{ROLE_LABEL[user.role]}</TableCell>
      <TableCell className="font-mono text-xs">{identifier}</TableCell>
      <TableCell className="text-muted-foreground">{department}</TableCell>
      <TableCell>
        <UserStatusBadge status={user.status} />
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Actions for {formatName(user)}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {ALL_STATUSES.filter((s) => s !== user.status).map((s) => (
              <DropdownMenuItem key={s} onClick={() => onChangeStatus(s)}>
                Mark as {s.toLowerCase()}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
