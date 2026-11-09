# UEMP — University Education Management Portal

A role-based university management portal (Student, Lecturer, Department Admin, Super Admin) covering course registration, result entry/approval, and academic administration. Built as a practical software development assessment — see [`REQUIREMENTS.md`](./REQUIREMENTS.md) for the full spec.

## Project structure

```
backend/    NestJS + Prisma + PostgreSQL API — see backend/README.md to run it
frontend/   Next.js (App Router) client — see frontend/README.md
docs/       Architecture, database schema (ER diagram), and RBAC/security design docs
```

## Quick start

```bash
# Backend
cd backend && cp .env.example .env && pnpm install
docker compose up -d && pnpm prisma:migrate && pnpm db:seed
pnpm start:dev   # http://localhost:4000/v1 (Swagger at /v1/docs)

# Frontend (separate terminal)
cd frontend && pnpm install
pnpm dev         # http://localhost:3000
```

## Test credentials

Password for all seeded accounts: `Password123!`

| Role | Email |
| --- | --- |
| Super Admin | `superadmin@uemp.test` |
| Dept Admin (Computer Science) | `deptadmin@uemp.test` |
| Lecturer | `lecturer@uemp.test` |
| Student | `student@uemp.test` |

## Documentation

- [`docs/00-tech-stack.md`](./docs/00-tech-stack.md) — stack decisions and why
- [`docs/01-architecture.md`](./docs/01-architecture.md) — backend/frontend module layout
- [`docs/02-database-schema.md`](./docs/02-database-schema.md) — ER diagram + business-rule-to-constraint mapping
- [`docs/03-rbac-security.md`](./docs/03-rbac-security.md) — permission matrix and auth design
- [`docs/04-design-system.md`](./docs/04-design-system.md) — frontend typography/color/dark-mode conventions
