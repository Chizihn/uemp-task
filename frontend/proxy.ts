import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeJwtPayload, isExpired } from "@/lib/jwt";
import { DASHBOARD_HOME } from "@/lib/types";

// Next.js 16 renamed `middleware.ts` -> `proxy.ts` (same API, exports `proxy`
// instead of `middleware`). This is a UX convenience only — it decides what
// to *show*, not what's *allowed*. The backend re-verifies everything on
// every request; see docs/03-rbac-security.md.
//
// Deliberately no per-role URL prefixes: every authenticated user lands on
// the same `/dashboard`, which renders different content based on who's
// logged in. Per-page role restriction (e.g. only Super Admin can see
// /dashboard/faculties) lives in each page via `useRequireRole`, not here.
const ACCESS_TOKEN_COOKIE = "uemp_access_token";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const payload = token ? decodeJwtPayload(token) : null;
  const isAuthenticated = !!payload && !isExpired(payload);

  if (pathname === "/login") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(DASHBOARD_HOME, request.url));
    }
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("from", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL(DASHBOARD_HOME, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|api/|favicon.ico).*)"],
};
