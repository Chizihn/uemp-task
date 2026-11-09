# UEMP — University Education Management Portal

A role-based university management portal (Student, Lecturer, Department Admin, Super Admin) covering course registration, result entry/approval, and academic administration. Built as a practical software development assessment.

## Project structure

```
backend/    NestJS + Prisma + PostgreSQL API — see backend/README.md to run it
frontend/   Next.js (App Router) client — see frontend/README.md
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

