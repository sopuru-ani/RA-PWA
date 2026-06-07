"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";

import { useTheme } from "next-themes";
import NavMoreTrigger from "@/components/nav/NavMoreTrigger";
import { apiFetch, clearAuthToken } from "@/lib/api-client";
import { calendarPath } from "@/lib/program-labels";
import type { LucideIcon } from "lucide-react";

type Props = {
  label: string;
  icon: LucideIcon;
};

function RAMore({ label, icon }: Props) {
  const { setTheme } = useTheme();
  const router = useRouter();

  async function handleLogout() {
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
        <NavMoreTrigger label={label} icon={icon} />
      <DropdownMenuContent className="w-56 mx-2" align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={calendarPath("RA")}>Calendar</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/ra/dashboard/programs/new">Create a program</Link>
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
        <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
      </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default RAMore;
