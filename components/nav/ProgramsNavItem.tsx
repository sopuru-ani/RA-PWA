"use client";

import { ClipboardList } from "lucide-react";
import { NavItem } from "@/components/NavItem";
import {
  programNotificationCount,
  useProgramStats,
} from "@/hooks/use-program-stats";
import type { ProgramStats } from "@/types/programs";

type Props = {
  href: string;
  stats?: ProgramStats;
};

export default function ProgramsNavItem({ href, stats: initial }: Props) {
  const { stats } = useProgramStats(initial);
  const count = programNotificationCount(stats);
  const badge = count > 0 ? (count > 99 ? "99+" : count) : undefined;

  return (
    <NavItem
      label="Programs"
      icon={[ClipboardList, ClipboardList]}
      href={href}
      matchPrefix
      badge={badge}
    />
  );
}
