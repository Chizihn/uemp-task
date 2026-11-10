# UEMP — Test Login Credentials

Live app: **https://uemp.chizihn.com**
API base: **https://uemp-task.onrender.com/v1**

The database is seeded with a full, realistic department (2 departments, 2 academic
sessions, 6 lecturers, 15 students, 15 courses) covering every stage of the result
workflow, so each account below has real data to view without any manual setup.

Password for **every** account below: **`Password123!`**

## One account per role (minimum needed to test)

| Role | Email | What to expect |
| --- | --- | --- |
| **Super Admin** | `superadmin@uemp.test` | University-wide access — faculties, departments, programs, academic sessions, all users, department admin assignment, audit log. |
| **Department Admin** | `deptadmin@uemp.test` | Scoped to Computer Science — students, lecturers, courses, course allocation, pending result approvals, reports. |
| **Lecturer** | `lecturer@uemp.test` | Dr. Tunde Bakare (`LEC-001`) — teaches several CSC courses across levels and two academic sessions; has students in every result stage (draft, submitted, approved, rejected) to grade/review. |
| **Student** | `student@uemp.test` | Amara Eze, `CSC/2021/001`, 300 level — registered courses, results across two sessions, CGPA computed from real multi-semester history. |

## Additional accounts (for deeper testing)

| Role | Email | Notes |
| --- | --- | --- |
| Dept Admin | `mthdeptadmin@uemp.test` | Scoped to Mathematics — use alongside `deptadmin@` to verify departmental data isolation (neither can see the other's students/lecturers/courses). |
| Lecturer | `folasade.adeniran@uemp.test` | Additional CSC teaching staff. |
| Lecturer | `emeka.nwosu@uemp.test` | Additional CSC teaching staff. |
| Lecturer | `ibrahim.yusuf@uemp.test` | Seeded `SUSPENDED` — use to confirm a suspended account is rejected at login. |
| Lecturer | `grace.okonkwo@uemp.test` | Mathematics. |
| Student | 11 more `@uemp.test` accounts | Spread across CSC levels 100–400 (one `SUSPENDED`, one `INACTIVE`) plus 2 Mathematics students. See `backend/prisma/seed.ts` for the full roster. |

## Notes for reviewers

- The seed script is idempotent (`pnpm db:seed` in `backend/`) — re-running it is safe and won't duplicate data.
- A suspended or inactive account will be rejected at login with a clear error message — this is intentional, not a bug.
