/** Canonical action names so every call site logs the same string for the same event. */
export const AuditAction = {
  LOGIN: 'auth.login',
  LOGOUT: 'auth.logout',
  REGISTER_COURSE: 'registration.create',
  RESULT_SAVE_DRAFT: 'result.save_draft',
  RESULT_SUBMIT: 'result.submit',
  RESULT_APPROVE: 'result.approve',
  RESULT_REJECT: 'result.reject',
  RESULT_REOPEN: 'result.reopen',
  PROFILE_UPDATE: 'profile.update',
  PASSWORD_CHANGE: 'password.change',
  USER_ACTIVATE: 'user.activate',
  USER_SUSPEND: 'user.suspend',
  USER_ROLE_CHANGE: 'user.role_change',
  DEPT_ADMIN_REASSIGN: 'dept_admin.reassign',
  REPORT_EXPORT: 'report.export',
} as const;
