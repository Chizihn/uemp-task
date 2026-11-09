# UEMP Frontend

Next.js (App Router) client for the University Education Management Portal. A single client-rendered dashboard shell serves all four roles (Student, Lecturer, Department Admin, Super Admin) — there are no role-specific URL prefixes; each page decides what to render and which role may see it.

## Prerequisites

- Node.js 20+
- pnpm (`corepack enable` or `npm i -g pnpm`)
- The backend running (see [`../backend/README.md`](../backend/README.md)) — this app is a pure client to that API, it has no server-side data access of its own.

## Setup

```bash
cd frontend
cp .env.example .env.local   # defaults point at the local backend on :4000
pnpm install
pnpm dev                     # http://localhost:3000
```

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API, including its `/v1` prefix (e.g. `https://api.example.com/v1` in a non-local deployment). |

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Run with hot reload (Turbopack) |
| `pnpm build` / `pnpm start` | Production build and run |
| `pnpm lint` | ESLint |

## Architecture

- **Auth state**: there is no separate auth store — `useCurrentUser()` (a TanStack Query hook backed by `GET /auth/me`) *is* the auth state. The access/refresh tokens live in httpOnly cookies set by the backend; a `proxy.ts` (Next's middleware) only decides what to *show* based on the cookie's presence, never what's *allowed* — every real authorization decision is re-checked server-side.
- **Routing**: every authenticated page lives under the single `/dashboard` prefix. Per-page role restriction is enforced client-side via `useRequireRole()` (for UX only — the backend enforces the real boundary) and the page itself renders different content depending on `user.role`.
- **Data fetching**: TanStack Query throughout, with a query-key factory per domain (`lib/query-keys.ts`) and an axios instance (`lib/api/client.ts`) that transparently refreshes an expired access token and retries the original request once.
- **UI**: Base UI primitives (not Radix) via a local `shadcn`-style component layer under `components/ui/`, styled with Tailwind v4.
