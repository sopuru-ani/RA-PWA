"use client";

import { useEffect, useState } from "react";
import { fetchProgramStats } from "@/lib/programs-api";
import type { ProgramStats } from "@/types/programs";

export function programNotificationCount(stats: ProgramStats | null | undefined): number {
  if (!stats) return 0;
  return (
    stats.pendingRsvpCount +
    stats.requiredCount +
    (stats.pendingApprovalCount ?? 0) +
    stats.draftOrPendingOwnCount
  );
}

export function useProgramStats(initial?: ProgramStats) {
  const [stats, setStats] = useState<ProgramStats | null>(initial ?? null);
  const [loading, setLoading] = useState(!initial);

  useEffect(() => {
    if (initial) {
      setStats(initial);
      setLoading(false);
      return;
    }

    let mounted = true;
    async function load() {
      try {
        const data = await fetchProgramStats();
        if (mounted) setStats(data);
      } catch {
        if (mounted) setStats(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [initial]);

  return {
    stats,
    loading,
    notificationCount: programNotificationCount(stats),
  };
}
