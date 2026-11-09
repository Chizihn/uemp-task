import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  GraduationCap,
  FileBarChart,
  Users,
  UserCog,
  CheckSquare,
  Landmark,
  Building2,
  CalendarRange,
  ShieldCheck,
} from "lucide-react";
import type { NavItem } from "@/components/shared/dashboard-shell";
import type { Role } from "@/lib/types";

/** Per-role sidebar nav. Every href lives under the one shared /dashboard prefix. */
export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  STUDENT: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Available Courses", href: "/dashboard/available-courses", icon: BookOpen },
    { label: "My Registrations", href: "/dashboard/registrations", icon: ClipboardList },
    { label: "Results", href: "/dashboard/results", icon: GraduationCap },
  ],
  LECTURER: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "My Courses", href: "/dashboard/my-courses", icon: BookOpen },
    { label: "Performance", href: "/dashboard/performance", icon: FileBarChart },
  ],
  DEPT_ADMIN: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Students", href: "/dashboard/students", icon: Users },
    { label: "Lecturers", href: "/dashboard/lecturers", icon: UserCog },
    { label: "Courses", href: "/dashboard/courses", icon: BookOpen },
    { label: "Approvals", href: "/dashboard/approvals", icon: CheckSquare },
    { label: "Reports", href: "/dashboard/reports", icon: FileBarChart },
  ],
  SUPER_ADMIN: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Faculties", href: "/dashboard/faculties", icon: Landmark },
    { label: "Departments", href: "/dashboard/departments", icon: Building2 },
    { label: "Programs", href: "/dashboard/programs", icon: GraduationCap },
    { label: "Academic Sessions", href: "/dashboard/sessions", icon: CalendarRange },
    { label: "Department Admins", href: "/dashboard/dept-admins", icon: UserCog },
    { label: "Users", href: "/dashboard/users", icon: Users },
    { label: "Reports", href: "/dashboard/reports", icon: FileBarChart },
    { label: "Audit Log", href: "/dashboard/audit-log", icon: ShieldCheck },
  ],
};
