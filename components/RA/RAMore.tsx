"use client";
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

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL_LAN;
function RAMore({ label, icon: Icon, className }: NavItemProps) {
  const { setTheme } = useTheme();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch(`${BASE_URL}api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

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
