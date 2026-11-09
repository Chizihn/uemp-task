/**
 * Query key factories, one per domain. Convention for every future module
 * (students, courses, results, ...): a `root` tuple for "everything in this
 * domain" (used to invalidate broadly after a mutation), a `list(filters)`
 * tuple that includes the filter object so different filter combos cache
 * separately, and a `detail(id)` tuple for a single record. Keep filter
 * objects plain and serializable — they become part of the cache key.
 *
 * Example for a future module:
 *   export const studentKeys = {
 *     root: ['students'] as const,
 *     list: (filters: StudentFilters) => [...studentKeys.root, 'list', filters] as const,
 *     detail: (id: string) => [...studentKeys.root, 'detail', id] as const,
 *   };
 */

export const authKeys = {
  root: ["auth"] as const,
  me: () => [...authKeys.root, "me"] as const,
};

export const facultyKeys = {
  root: ["faculties"] as const,
  list: () => [...facultyKeys.root, "list"] as const,
};

export const departmentKeys = {
  root: ["departments"] as const,
  list: (filters: { facultyId?: string }) => [...departmentKeys.root, "list", filters] as const,
};

export const programKeys = {
  root: ["programs"] as const,
  list: (filters: { departmentId?: string }) => [...programKeys.root, "list", filters] as const,
};

export const academicSessionKeys = {
  root: ["academic-sessions"] as const,
  list: () => [...academicSessionKeys.root, "list"] as const,
};

export const userKeys = {
  root: ["users"] as const,
  list: (filters: object) => [...userKeys.root, "list", filters] as const,
};

export const deptAdminKeys = {
  root: ["dept-admins"] as const,
  list: (departmentId?: string) => [...deptAdminKeys.root, "list", departmentId ?? null] as const,
};

export const studentKeys = {
  root: ["students"] as const,
  list: (filters: object) => [...studentKeys.root, "list", filters] as const,
};

export const lecturerKeys = {
  root: ["lecturers"] as const,
  list: (filters: object) => [...lecturerKeys.root, "list", filters] as const,
};

export const courseKeys = {
  root: ["courses"] as const,
  list: (filters: object) => [...courseKeys.root, "list", filters] as const,
};

export const allocationKeys = {
  root: ["course-allocations"] as const,
  list: (filters: object) => [...allocationKeys.root, "list", filters] as const,
};

export const registrationKeys = {
  root: ["registrations"] as const,
  eligible: () => [...registrationKeys.root, "eligible"] as const,
  mine: (filters: object) => [...registrationKeys.root, "mine", filters] as const,
};

export const auditLogKeys = {
  root: ["audit-log"] as const,
  list: (filters: object) => [...auditLogKeys.root, "list", filters] as const,
};

export const reportKeys = {
  root: ["reports"] as const,
  registrationSummary: (filters: object) =>
    [...reportKeys.root, "registration-summary", filters] as const,
  performanceSummary: (filters: object) =>
    [...reportKeys.root, "performance-summary", filters] as const,
};

export const resultKeys = {
  root: ["results"] as const,
  classList: (courseAllocationId: string) => [...resultKeys.root, "class-list", courseAllocationId] as const,
  mySubmissions: () => [...resultKeys.root, "my-submissions"] as const,
  pending: (filters: object) => [...resultKeys.root, "pending", filters] as const,
  mine: () => [...resultKeys.root, "mine"] as const,
};
