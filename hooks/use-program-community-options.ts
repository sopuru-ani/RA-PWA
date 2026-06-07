"use client";

import { useEffect, useState } from "react";
import { fetchProgramCommunityOptions } from "@/lib/programs-api";

export function useProgramCommunityOptions() {
  const [communities, setCommunities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const names = await fetchProgramCommunityOptions();
        if (!mounted) return;
        setCommunities(names);
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load communities",
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return { communities, loading, error };
}
