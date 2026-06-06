"use client";

import { Badge } from "@/components/ui/badge";
import {
  programNotificationCount,
  useProgramStats,
} from "@/hooks/use-program-stats";
import type { ProgramStats } from "@/types/programs";

type Props = {
  stats?: ProgramStats;
};

export default function ProgramNavBadge({ stats: initial }: Props) {
  const { stats } = useProgramStats(initial);
  const count = programNotificationCount(stats);

  if (count <= 0) return null;

  return (
    <Badge
      variant="default"
      className="ml-auto h-5 min-w-5 px-1 text-[10px] text-white"
    >
      {count > 99 ? "99+" : count}
    </Badge>
  );
}
