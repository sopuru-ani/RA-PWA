"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, clearAuthToken } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import type { LucideIcon } from "lucide-react";

type Props = {
  label: string;
  icon: LucideIcon;
};

function GAMore({ label, icon: Icon }: Props) {
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
          <Icon className="h-5! w-5!" />
          <span>{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 mx-2" align="start">
        <DropdownMenuLabel>Area Director</DropdownMenuLabel>
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
  );
}

export default GAMore;
