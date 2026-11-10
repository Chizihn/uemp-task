# UEMP — Database Design

PostgreSQL via Prisma. Full schema: `backend/prisma/schema.prisma`. This document is a
readable summary of the same structure.

## Entity-Relationship Diagram

```mermaid
erDiagram
    Faculty ||--o{ Department : "has"
    Department ||--o{ Program : "has"
    Department ||--o{ Course : "has"
    Department ||--o{ Student : "has"
    Department ||--o{ Lecturer : "has"
    Department ||--o{ DeptAdminProfile : "has"
    Program ||--o{ Student : "enrolls"

    User ||--o| Student : "is a"
    User ||--o| Lecturer : "is a"
    User ||--o| DeptAdminProfile : "is a"
    User ||--o{ AuditLog : "performs"
    User ||--o{ Result : "reviews"

    AcademicSession ||--o{ Semester : "has"
    AcademicSession ||--o{ CourseAllocation : "scopes"
    Semester ||--o{ CourseAllocation : "scopes"
    Course ||--o{ CourseAllocation : "offered as"
    Lecturer ||--o{ CourseAllocation : "teaches"

    CourseAllocation ||--o{ Registration : "enrolled into"
    Student ||--o{ Registration : "registers for"
    Registration ||--o| Result : "graded as"

    User {
        string id PK
        string email UK
        string passwordHash
        Role role
        UserStatus status
    }
    Faculty {
        string id PK
        string code UK
        boolean isActive
    }
    Department {
        string id PK
        string facultyId FK
        string code UK
        boolean isActive
    }
    Program {
        string id PK
        string departmentId FK
        int durationYears
        int maxLevel
    }
    Student {
        string id PK
        string userId FK "unique"
        string matricNumber UK
        string departmentId FK
        string programId FK
        int level
    }
    Lecturer {
        string id PK
        string userId FK "unique"
        string staffId UK
        string departmentId FK
    }
    DeptAdminProfile {
        string id PK
        string userId FK "unique"
        string departmentId FK
    }
    AcademicSession {
        string id PK
        string name UK
        boolean isActive
    }
    Semester {
        string id PK
        string sessionId FK
        Term term
        boolean isActive
    }
    Course {
        string id PK
        string code UK
        int units
        int level
        Term term
        string departmentId FK
    }
    CourseAllocation {
        string id PK
        string courseId FK
        string lecturerId FK
        string sessionId FK
        string semesterId FK
    }
    Registration {
        string id PK
        string studentId FK
        string courseAllocationId FK
    }
    Result {
        string id PK
        string registrationId FK "unique"
        float caScore
        float examScore
        float totalScore
        string grade
        ResultStatus status
        string reviewedById FK
    }
    AuditLog {
        string id PK
        string userId FK
        string action
        string entityType
        string entityId
    }
```

`GradingScale` (score range → letter grade + grade point) is a standalone reference
table with no foreign keys — it's read by the grading utility, not joined.

## Design notes

- **Identity vs. role profile**: `User` holds auth/account fields only (email,
  password hash, role, status). Each role's extra fields live in a separate 1:1
  table (`Student`, `Lecturer`, `DeptAdminProfile`) rather than one wide `users`
  table with mostly-null columns — a user has at most one of these, enforced by a
  `@unique` on the foreign key, and `onDelete: Cascade` keeps the profile from
  outliving its `User` row.
- **Institutional hierarchy**: `Faculty → Department → Program/Course` mirrors how a
  real university is organized, and every operational table (`Student`, `Lecturer`,
  `Course`) hangs off `Department`, which is what makes departmental data isolation
  possible — a Department Admin's queries are scoped by their own `departmentId`,
  never a client-supplied one.
- **Why `CourseAllocation` exists** instead of a direct `Course ↔ Lecturer` link:
  the same course is taught by (possibly different) lecturers across different
  sessions/semesters, so "who teaches what, when" is its own entity. `Registration`
  then points at a specific `CourseAllocation`, not just a `Course` — a student's
  registration is tied to a specific session/semester/lecturer offering.
- **`Result` is optional on `Registration`** (`Registration.result?`): registering
  for a course and having a result are different states — the result is only
  created once a lecturer starts entering scores, which is what lets the UI show
  "Registered, not yet graded" accurately.
- **Result state machine**: `DRAFT → SUBMITTED → APPROVED`, with `REJECTED` looping
  a submission back to the lecturer (with `rejectionReason`) for correction and
  resubmission. `reviewedById`/`reviewedAt` record which Department Admin acted on
  it, for the audit trail.
- **Soft state, not hard deletes**: `Faculty`, `Department`, `Program`, and `Course`
  all have `isActive` rather than being deletable — deactivating one hides it from
  active workflows without destroying the historical records (results, past
  registrations) that point at it.
- **Indexes** are placed on every foreign key used in a scoped lookup
  (`departmentId`, `lecturerId`, `sessionId`+`semesterId`) and on `Result.status`
  and `AuditLog.entityType`+`entityId`/`createdAt`, since those are the columns
  actually filtered on in the approval queues, class lists, and audit log views.
