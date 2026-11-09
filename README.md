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

| Role | Email | Notes |
| --- | --- | --- |
| Super Admin | `superadmin@uemp.test` | University-wide access |
| Dept Admin | `deptadmin@uemp.test` | Scoped to Computer Science |
| Dept Admin | `mthdeptadmin@uemp.test` | Scoped to Mathematics — for checking departmental isolation |
| Lecturer | `lecturer@uemp.test` | Dr. Tunde Bakare, teaches across multiple CSC courses/levels |
| Student | `student@uemp.test` | Amara Eze, CSC/2021/001, 300 level — has graded history across two sessions |

The seed loads a full Computer Science department (15 students across every level, 5 lecturers including one suspended, 14 courses across all levels/terms, two academic sessions) with results covering every stage of the approval workflow — see [`backend/README.md`](backend/README.md) and `backend/prisma/seed.ts` for the complete roster.

