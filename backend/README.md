# UEMP Backend

NestJS + Prisma + PostgreSQL API for the University Education Management Portal. See [`/docs`](../docs) for architecture, database schema, and RBAC/security design documentation.

## Prerequisites

- Node.js 20+
- pnpm (`corepack enable` or `npm i -g pnpm`)
- Docker (for local PostgreSQL)

## Setup

```bash
cd backend
cp .env.example .env        # defaults work out of the box for local dev
pnpm install
docker compose up -d        # starts PostgreSQL on localhost:5432
pnpm prisma:migrate         # applies the schema
pnpm db:seed                # loads sample data (faculties, courses, one user per role, sample registrations/results)
pnpm start:dev               # http://localhost:4000/v1
```

API docs (Swagger) are served at `http://localhost:4000/v1/docs` outside of production.

## Test credentials

Seeded by `prisma/seed.ts`. Password for all accounts: `Password123!`

| Role | Email | Notes |
| --- | --- | --- |
| Super Admin | `superadmin@uemp.test` | University-wide access |
| Dept Admin | `deptadmin@uemp.test` | Scoped to Computer Science |
| Lecturer | `lecturer@uemp.test` | Assigned to CSC301/CSC302/CSC303 |
| Student | `student@uemp.test` | CSC/2021/001, 300 level, one approved + one pending result pre-loaded |

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm start:dev` | Run with hot reload |
| `pnpm build` / `pnpm start:prod` | Production build and run |
| `pnpm lint` | ESLint (with `--fix`) |
| `pnpm test` | Unit tests |
| `pnpm prisma:migrate` | Create/apply a migration from schema changes |
| `pnpm prisma:studio` | Browse the database |
| `pnpm db:seed` | Re-run the seed script (idempotent — safe to re-run) |

## Environment variables

See `.env.example` for the full list. The ones that matter for a non-local deployment:

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — set these to real random secrets in any non-local environment
- `COOKIE_DOMAIN` — the domain the auth cookies are scoped to
- `CORS_ORIGIN` — the deployed frontend's origin
- `CLOUDINARY_*` — optional; only needed for avatar uploads (`POST /media/avatar`)

## Architecture

Feature-module-per-domain NestJS structure (`auth`, `students`, `lecturers`, `courses`, `course-allocations`, `registrations`, `results`, `reports`, `audit-log`, `media`, ...). Every endpoint is authorized twice: a role check (`@Roles()` + `RolesGuard`) and, inside the service layer, a data-scope check derived from the authenticated user's own profile — never from client-supplied IDs. Full rationale in [`/docs/01-architecture.md`](../docs/01-architecture.md) and [`/docs/03-rbac-security.md`](../docs/03-rbac-security.md).
