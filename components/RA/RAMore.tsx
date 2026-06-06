"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { useTheme } from "next-themes";

interface NavItemProps {
  label: string;
  icon: React.ElementType;
  className?: string;
}

import { apiFetch, clearAuthToken } from "@/lib/api-client";
import ProgramNavBadge from "@/components/programs/ProgramNavBadge";
import { useResidents } from "@/context/RAResidentProvider";

function RAMore({ label, icon: Icon, className }: NavItemProps) {
  const { setTheme } = useTheme();
  const router = useRouter();
  const { programStats } = useResidents();

  async function handleLogout() {
    try {
      await apiFetch("api/auth/logout", { method: "POST" });
      clearAuthToken();

      router.replace("/login"); // or wherever your login page is
    } catch (err) {
      console.error("Logout failed", err);
    }
  }
  return (
    <div className={cn("", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="navItem" size="navItem">
            <Icon className="h-5! w-5!" />
            <span>{label}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 mx-2" align="start">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/ra/dashboard/programs" className="flex items-center w-full">
                Programs
                <ProgramNavBadge stats={programStats} />
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/ra/dashboard/programs/new">Create a program</Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/ra/calendar">Calendar</Link>
          </DropdownMenuItem>
          <DropdownMenuGroup>
            <DropdownMenuItem>Profile(subject to change)</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
          </DropdownMenuGroup>

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
          <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default RAMore;
