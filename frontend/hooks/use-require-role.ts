"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "./use-auth";
import { DASHBOARD_HOME, type Role } from "@/lib/types";

export function useRequireRole(allowed: Role | Role[]) {
  const router = useRouter();
  const { data: user, isLoading, isError } = useCurrentUser();
  const allowedRoles = Array.isArray(allowed) ? allowed : [allowed];

  useEffect(() => {
    if (isLoading) return;
    if (isError || !user) {
      router.replace("/login");
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      router.replace(DASHBOARD_HOME);
    }
    // allowedRoles is a fresh array each render when `allowed` is an inline literal; compare by value instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isError, user, router, allowedRoles.join(",")]);

  const ready = !isLoading && !isError && !!user && allowedRoles.includes(user.role);
  return { user: ready ? user! : undefined, ready };
}

/** Same as `useRequireRole`, but any authenticated role is fine — used by the shared dashboard shell. */
export function useRequireAuth() {
  const router = useRouter();
  const { data: user, isLoading, isError } = useCurrentUser();

  useEffect(() => {
    if (isLoading) return;
    if (isError || !user) {
      router.replace("/login");
    }
  }, [isLoading, isError, user, router]);

  const ready = !isLoading && !isError && !!user;
  return { user: ready ? user! : undefined, ready };
}
