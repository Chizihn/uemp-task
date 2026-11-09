"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, UserCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "cn";
import { formatName, initialsFromName } from "@/lib/utils";
import { useLogout } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ROLE_LABEL, type CurrentUser } from "@/lib/types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface DashboardShellProps {
  nav: NavItem[];
  user: CurrentUser;
  children: React.ReactNode;
}

export function DashboardShell({ nav, user, children }: DashboardShellProps) {
  return (
    <div className="flex h-svh overflow-hidden print:h-auto print:overflow-visible">
      <aside className="hidden w-56 shrink-0 flex-col overflow-y-auto border-r md:flex print:hidden">
        <SidebarContent nav={nav} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 print:hidden">
          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" />}>
              <Menu className="size-4" />
              <span className="sr-only">Open menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 gap-0 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <SidebarContent nav={nav} />
            </SheetContent>
          </Sheet>

          <div className="flex-1" />
          <ThemeToggle />
          <UserMenu user={user} />
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6 print:overflow-visible print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}

const NAV_LINK_CLASS =
  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";
const NAV_LINK_ACTIVE_CLASS = "bg-brand/10 text-brand hover:bg-brand/10 hover:text-brand";

function isNavItemActive(pathname: string, href: string): boolean {
  return href === "/dashboard"
    ? pathname === "/dashboard"
    : pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarContent({ nav }: { nav: NavItem[] }) {
  const pathname = usePathname();
  const logout = useLogout();
  const profileActive = isNavItemActive(pathname, "/dashboard/profile");

  return (
    <>
      <div className="flex h-14 items-center gap-2 border-b px-4 font-heading text-lg font-medium">
        <span className="flex size-7 items-center justify-center rounded-lg bg-brand text-sm text-brand-foreground">
          U
        </span>
        UEMP
      </div>
      <nav aria-label="Sidebar navigation" className="flex flex-1 flex-col gap-1 p-2">
        {nav.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(NAV_LINK_CLASS, active && NAV_LINK_ACTIVE_CLASS)}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}

        <div className="mt-auto flex flex-col gap-1 border-t pt-2">
          <Link
            href="/dashboard/profile"
            aria-current={profileActive ? "page" : undefined}
            className={cn(NAV_LINK_CLASS, profileActive && NAV_LINK_ACTIVE_CLASS)}
          >
            <UserCircle className="size-4" />
            Profile
          </Link>
          <button
            type="button"
            onClick={() => logout.mutate()}
            className={cn(NAV_LINK_CLASS, "w-full cursor-pointer")}
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </div>
      </nav>
    </>
  );
}

function UserMenu({ user }: { user: CurrentUser }) {
  const logout = useLogout();
  const name = formatName(user);
  const initials = initialsFromName(user);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" className="gap-2 px-1.5" />}>
        <Avatar size="sm">
          <AvatarImage src={user.avatarUrl ?? undefined} alt={name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <span className="hidden text-sm font-medium sm:inline">{name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{name}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
              {user.role !== "STUDENT" && (
                <span className="text-xs text-muted-foreground">{ROLE_LABEL[user.role]}</span>
              )}
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/dashboard/profile" />}>
          <UserCircle /> Profile settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => logout.mutate()}>
          <LogOut /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
