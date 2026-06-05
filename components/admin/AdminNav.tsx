"use client";

import {
  LayoutDashboard,
  Users,
  Building2,
  GraduationCap,
  Network,
  Menu,
  Croissant,
} from "lucide-react";
import { NavItem } from "@/components/NavItem";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, clearAuthToken } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

function AdminMore() {
  const router = useRouter();
  const { setTheme } = useTheme();
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="navItem" size="navItem">
          <Croissant className="h-5! w-5!" />
          <span>More</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 mx-2" align="start">
        <DropdownMenuLabel>Admin</DropdownMenuLabel>
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
  );
}

function AdminNav() {
  return (
    <nav className={cn("relative border-t bg-background")}>
      <div className="flex justify-around">
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
        <NavItem
          label="Structure"
          icon={[Network, Network]}
          href="/admin/structure"
        />
        <AdminMore />
      </div>
    </nav>
  );
}

export default AdminNav;
