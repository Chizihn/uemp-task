// Domain types, organized by area. Mirrors backend/prisma/schema.prisma — keep in sync by
// hand (no shared package yet). Request/response DTOs for a given domain live next to its
// entities here; `lib/api/*.ts` imports and re-exports them rather than declaring its own.
export * from "@/lib/types/common";
export * from "@/lib/types/org";
export * from "@/lib/types/academic-period";
export * from "@/lib/types/people";
export * from "@/lib/types/auth";
export * from "@/lib/types/course";
export * from "@/lib/types/registration";
export * from "@/lib/types/result";
export * from "@/lib/types/reports";
export * from "@/lib/types/audit";
export * from "@/lib/types/media";
