"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, clearAuthToken } from "@/lib/api-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import type { LucideIcon } from "lucide-react";
import NavMoreTrigger from "@/components/nav/NavMoreTrigger";
import { calendarPath } from "@/lib/program-labels";

type Props = {
  label: string;
  icon: LucideIcon;
};

function GAMore({ label, icon }: Props) {
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
    <div className="w-full min-w-0">
      <DropdownMenu>
        <NavMoreTrigger label={label} icon={icon} />
      <DropdownMenuContent className="w-56 mx-2" align="end">
        <DropdownMenuLabel>Area Director</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href="/ga/dashboard/inspections">Inspections</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={calendarPath("GA")}>Calendar</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/ga/dashboard/programs/new">Create a program</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/ga/dashboard/residents/add">Add resident</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/ga/dashboard/residents/bulk">Bulk add residents</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/ga/dashboard/residents/requests">My requests</Link>
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

export default GAMore;
