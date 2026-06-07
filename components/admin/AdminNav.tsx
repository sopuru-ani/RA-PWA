"use client";

import {
  LayoutDashboard,
  Users,
  Building2,
  GraduationCap,
  Croissant,
} from "lucide-react";
import { NavItem } from "@/components/NavItem";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, clearAuthToken } from "@/lib/api-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import ProgramNavBadge from "@/components/programs/ProgramNavBadge";
import NavMoreTrigger from "@/components/nav/NavMoreTrigger";
import { useAdminSession } from "@/context/AdminSessionContext";
import { bottomNavClassName, bottomNavGridClassName } from "@/lib/bottom-nav";
import { calendarPath } from "@/lib/program-labels";

function AdminMore() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { stats } = useAdminSession();

  async function logout() {
    try {
      await apiFetch("api/auth/logout", { method: "POST" });
      clearAuthToken();
      router.replace("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  }

  return (
    <div className="w-full min-w-0">
      <DropdownMenu>
        <NavMoreTrigger label="More" icon={Croissant} />
      <DropdownMenuContent className="w-56 mx-2" align="end">
        <DropdownMenuLabel>Admin</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href="/admin/programs" className="flex items-center w-full">
            Programs
            <ProgramNavBadge stats={stats.programStats} />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={calendarPath("Admin")}>Calendar</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/structure">Structure</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/resident-requests">Resident requests</Link>
        </DropdownMenuItem>
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Theme</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  Dark
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  System
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout()}>Log out</DropdownMenuItem>
      </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function AdminNav() {
  return (
    <nav className={bottomNavClassName()}>
      <div className={bottomNavGridClassName(5)}>
        <NavItem
          label="Overview"
          icon={[LayoutDashboard, LayoutDashboard]}
          href="/admin/dashboard"
        />
        <NavItem
          label="Staff"
          icon={[Users, Users]}
          href="/admin/staff"
          matchPrefix
        />
        <NavItem
          label="Communities"
          icon={[Building2, Building2]}
          href="/admin/communities"
          matchPrefix
        />
        <NavItem
          label="Residents"
          icon={[GraduationCap, GraduationCap]}
          href="/admin/residents"
          matchPrefix
        />
        <AdminMore />
      </div>
    </nav>
  );
}

export default AdminNav;
