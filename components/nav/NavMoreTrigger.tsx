"use client";

import type { LucideIcon } from "lucide-react";
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { bottomNavItemClassName } from "@/lib/bottom-nav";

type Props = {
  label: string;
  icon: LucideIcon;
};

export default function NavMoreTrigger({ label, icon: Icon }: Props) {
  return (
    <DropdownMenuTrigger asChild>
      <button type="button" className={bottomNavItemClassName()}>
        <Icon className="h-5 w-5 shrink-0" />
        <span className="max-w-full truncate px-0.5">{label}</span>
      </button>
    </DropdownMenuTrigger>
  );
}
