import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeJwtPayload, isExpired } from "@/lib/jwt";
import { DASHBOARD_HOME, type Role } from "@/lib/types";

const ACCESS_TOKEN_COOKIE = "uemp_access_token";

// Server-side RBAC: map route prefixes to permitted roles
const ROLE_ROUTE_PERMISSIONS: { prefix: string; roles: Role[] }[] = [
  // Super Admin only routes
  { prefix: "/dashboard/faculties", roles: ["SUPER_ADMIN"] },
  { prefix: "/dashboard/departments", roles: ["SUPER_ADMIN"] },
  { prefix: "/dashboard/programs", roles: ["SUPER_ADMIN"] },
  { prefix: "/dashboard/sessions", roles: ["SUPER_ADMIN"] },
  { prefix: "/dashboard/dept-admins", roles: ["SUPER_ADMIN"] },
  { prefix: "/dashboard/users", roles: ["SUPER_ADMIN"] },
  { prefix: "/dashboard/audit-log", roles: ["SUPER_ADMIN"] },

  // Dept Admin & Super Admin routes
  { prefix: "/dashboard/students", roles: ["DEPT_ADMIN", "SUPER_ADMIN"] },
  { prefix: "/dashboard/lecturers", roles: ["DEPT_ADMIN", "SUPER_ADMIN"] },
  { prefix: "/dashboard/courses", roles: ["DEPT_ADMIN", "SUPER_ADMIN"] },
  { prefix: "/dashboard/approvals", roles: ["DEPT_ADMIN", "SUPER_ADMIN"] },
  { prefix: "/dashboard/reports", roles: ["DEPT_ADMIN", "SUPER_ADMIN"] },

  // Lecturer routes
  { prefix: "/dashboard/my-courses", roles: ["LECTURER"] },
  { prefix: "/dashboard/performance", roles: ["LECTURER"] },

  // Student routes
  { prefix: "/dashboard/available-courses", roles: ["STUDENT"] },
  { prefix: "/dashboard/registrations", roles: ["STUDENT"] },
  { prefix: "/dashboard/results", roles: ["STUDENT"] },
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const payload = token ? decodeJwtPayload(token) : null;
  const isAuthenticated = !!payload && !isExpired(payload);

  // 1. Server-side guard for /dashboard and all protected subroutes
  if (pathname.startsWith("/dashboard")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      if (pathname !== DASHBOARD_HOME) {
        loginUrl.searchParams.set("from", pathname);
      }
      return NextResponse.redirect(loginUrl);
    }

    // Server-side RBAC guard: check if user's role is allowed on this route
    if (payload?.role) {
      const rule = ROLE_ROUTE_PERMISSIONS.find((r) => pathname.startsWith(r.prefix));
      if (rule && !rule.roles.includes(payload.role)) {
        return NextResponse.redirect(new URL(DASHBOARD_HOME, request.url));
      }
    }

    return NextResponse.next();
  }

  // 2. Server-side guard for /login: authenticated users are redirected to dashboard
  if (pathname === "/login") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(DASHBOARD_HOME, request.url));
    }
    return NextResponse.next();
  }

  // 3. Root route redirect
  if (pathname === "/") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(DASHBOARD_HOME, request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
