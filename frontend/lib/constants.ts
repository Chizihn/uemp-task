export const LEVELS = [100, 200, 300, 400, 500, 600, 700] as const;

export const TERMS = ["FIRST", "SECOND", "THIRD"] as const;

/** Mirrors backend/src/registrations/registrations.constants.ts — display only, not enforced here. */
export const MAX_UNITS_PER_SEMESTER = 24;

/** Mirrors backend/src/audit-log/audit-action.constants.ts. */
export const AUDIT_ACTIONS: { value: string; label: string }[] = [
  { value: "auth.login", label: "Login" },
  { value: "auth.logout", label: "Logout" },
  { value: "registration.create", label: "Course registration" },
  { value: "result.save_draft", label: "Result draft saved" },
  { value: "result.submit", label: "Result submitted" },
  { value: "result.approve", label: "Result approved" },
  { value: "result.reject", label: "Result rejected" },
  { value: "result.reopen", label: "Result reopened" },
  { value: "profile.update", label: "Profile updated" },
  { value: "user.activate", label: "User activated" },
  { value: "user.suspend", label: "User suspended" },
  { value: "user.role_change", label: "User role changed" },
];
