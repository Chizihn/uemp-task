"use client";

import { useCurrentUser } from "@/hooks/use-auth";
import { StudentHome } from "./_components/student-home";
import { LecturerHome } from "./_components/lecturer-home";
import { DeptAdminHome } from "./_components/dept-admin-home";
import { SuperAdminHome } from "./_components/super-admin-home";

// One URL for everyone — the content below is what's actually dynamic per role,
// rather than the URL itself announcing who's logged in.
export default function DashboardPage() {
  const { data: user } = useCurrentUser();
  if (!user) return null;

  switch (user.role) {
    case "STUDENT":
      return <StudentHome user={user} />;
    case "LECTURER":
      return <LecturerHome user={user} />;
    case "DEPT_ADMIN":
      return <DeptAdminHome user={user} />;
    case "SUPER_ADMIN":
      return <SuperAdminHome user={user} />;
  }
}
