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

function SAMore({ label, icon }: Props) {
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
        <DropdownMenuLabel>Student Assistant</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={calendarPath("SA")}>Calendar</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/sa/dashboard/programs/new">Create a program</Link>
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

export default SAMore;
