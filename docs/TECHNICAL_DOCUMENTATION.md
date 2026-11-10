# UEMP — Technical Documentation

University Education Management Portal: a NestJS + PostgreSQL API and a Next.js
dashboard covering the full academic lifecycle — institutional structure, course
allocation, registration, grading/approval, and reporting — for four roles
(Student, Lecturer, Department Admin, Super Admin).

- **Live app**: https://uemp.chizihn.com
- **API**: https://uemp-task.onrender.com/v1
- **Source**: https://github.com/Chizihn/uemp-task
- **Database design**: [`DATABASE_DESIGN.md`](./DATABASE_DESIGN.md)
- **Test credentials**: [`TEST_CREDENTIALS.md`](../TEST_CREDENTIALS.md)

## 1. System Architecture

```
Browser
  │  https://uemp.chizihn.com
  ▼
Next.js (Vercel)
  │  proxy.ts (edge middleware) — reads the access-token cookie, decides what
  │  to *show* (redirect to /login or /dashboard); never the final authority.
  │  All API calls (client- and server-side) go to the NestJS API, authenticated
  │  via the httpOnly cookie issued at login.
  ▼
NestJS API (Render)
  │  Global guards: JwtAuthGuard (verifies the JWT) → RolesGuard (@Roles()).
  │  Every write/read is additionally scoped server-side to the caller's own
  │  department/profile — a client can never supply someone else's ID and
  │  get their data.
  ▼
PostgreSQL (Render)
```

**Backend module layout** (`backend/src/`): one NestJS module per domain —
`auth`, `students`, `lecturers`, `dept-admins`, `faculties`, `departments`,
`programs`, `academic-sessions`, `courses`, `course-allocations`, `registrations`,
`results`, `reports`, `audit-log`, `media`, `users` — each with its own
controller/service/DTOs, sharing cross-cutting concerns (`common/`: guards,
decorators, filters, interceptors, password hashing, grading/GPA utilities) and a
single `PrismaService` injected throughout.

**Frontend layout** (`frontend/`): a single `/dashboard` URL prefix for every role
— there are no role-specific route trees. Each page decides what to render based
on `user.role`, and per-page role restriction is enforced client-side via
`useRequireRole()` purely for UX (hiding/redirecting), never as the actual
authorization boundary — that's always re-checked server-side.

## 2. Technology Stack

**Backend**
- NestJS 11 (Express platform), TypeScript
- Prisma 6 + PostgreSQL
- Passport JWT (`passport-jwt`) for access-token verification, `@nestjs/jwt` for signing
- `argon2` (argon2id) for password hashing
- `class-validator` / `class-transformer` for request validation (whitelist + transform)
- `helmet` for security headers, `cookie-parser` for httpOnly auth cookies
- `pdfkit` for server-generated PDF reports; `cloudinary` for file storage (avatars, archived report PDFs)
- `@nestjs/swagger` for the interactive API explorer (non-production only)
- Jest for unit tests

**Frontend**
- Next.js 16 (App Router), React 19, TypeScript
- TanStack Query for all server-state/data-fetching (query-key factory per domain)
- Axios (with a response interceptor that transparently refreshes an expired
  access token and retries the original request once)
- React Hook Form + Zod for form state and validation
- Base UI primitives + Tailwind v4 (a local `shadcn`-style component layer)
- `next-themes` for light/dark mode

**Infrastructure**
- Frontend: Vercel (custom domain `uemp.chizihn.com`)
- Backend + database: Render (Postgres + Node web service)

## 3. Database Structure

See [`DATABASE_DESIGN.md`](./DATABASE_DESIGN.md) for the full ER diagram and the
reasoning behind each modeling decision. Summary: `Faculty → Department →
Program/Course` models the institutional hierarchy; `User` holds only
account/auth fields, with role-specific data split into `Student` / `Lecturer` /
`DeptAdminProfile` (1:1 extensions); `CourseAllocation` ties a `Course` to a
`Lecturer` for a specific `AcademicSession`/`Semester`; `Registration` links a
`Student` to a `CourseAllocation`; and `Result` (optional on `Registration`)
carries the grading state machine `DRAFT → SUBMITTED → APPROVED`, with
`REJECTED` looping back to the lecturer for correction.

## 4. Security Implementation

- **Authentication**: email + password, verified with `argon2.verify` against an
  `argon2id` hash (never a reversible or weaker hash). On success, a short-lived
  access token (15 min) and a longer-lived refresh token (7 days) are issued as
  separate JWTs and set as **httpOnly, `SameSite` cookies** — never exposed to
  client-side JavaScript, which rules out token theft via XSS reading
  `localStorage`. In production, cookies are `Secure` and `SameSite=None` since
  the frontend and API are on different domains; in development they're
  `SameSite=Lax` since both apps run on `localhost`.
- **Token refresh**: the frontend's axios interceptor catches a `401`, calls
  `POST /auth/refresh` once, and retries the original request — the refresh
  endpoint itself re-verifies the account is still `ACTIVE` before rotating the
  tokens, so a suspended account is logged out on its very next request even if
  its refresh token hasn't expired yet.
- **Authorization — two layers, never just one**:
  1. `JwtAuthGuard` + `RolesGuard`, applied globally (`APP_GUARD`), verify the
     JWT and check `@Roles(...)` metadata on every route. A route with no
     `@Roles()` is open to any authenticated user; `@Public()` bypasses auth
     entirely (login, refresh, health check).
  2. **Service-level data scoping**: a role check alone isn't enough — a
     Department Admin being "allowed" to hit `GET /students/:id` doesn't mean
     they should see every department's students. Every service method derives
     its scope from the authenticated user's *own* profile (their
     `departmentId`, their `lecturerId`, etc.), never from a client-supplied
     parameter. A Department Admin for Computer Science cannot fetch a
     Mathematics student's record by guessing its ID — the service filters by
     their own department before the query ever runs, so it 404s/empty-results
     rather than ever returning someone else's department's data.
- **Account status enforcement**: `SUSPENDED`/`INACTIVE` accounts are rejected
  both at login and on every refresh — status is re-checked against the database
  on each request, not cached in the JWT.
- **Input validation**: global `ValidationPipe` with `whitelist: true` and
  `forbidNonWhitelisted: true` — any request body field not declared on the DTO
  is rejected outright (verified live: posting an undeclared field returns a 400,
  not a silently-ignored extra field).
- **Transport/headers**: `helmet()` for standard security headers, CORS locked to
  an explicit allow-list (`CORS_ORIGIN`) with `credentials: true` rather than a
  wildcard origin.
- **Audit trail**: every login, logout, and state-changing action (approvals,
  rejections, reassignments, status changes) is recorded in `AuditLog` with the
  acting user, action, entity, and timestamp — visible to Super Admin.
- **Password reset**: admin-created accounts start with a temporary password and
  the user changes it themselves via an authenticated `PATCH /users/me/password`
  (requires the current password), rather than the admin ever knowing or setting
  a user's ongoing password.

## 5. Setup Instructions

### Backend

```bash
cd backend
cp .env.example .env        # defaults work out of the box for local dev
pnpm install
docker compose up -d        # starts PostgreSQL on localhost:5432
pnpm prisma:migrate         # applies the schema
pnpm db:seed                # loads a fully populated department
pnpm start:dev              # http://localhost:4000/v1
```

### Frontend

```bash
cd frontend
cp .env.example .env.local  # defaults point at the local backend on :4000
pnpm install
pnpm dev                    # http://localhost:3000
```

Full environment variable reference, scripts, and deployment notes are in each
app's own `README.md` (`backend/README.md`, `frontend/README.md`).
