"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

export type CommunityOption = {
  name: string;
  sections: string[];
};

export function useCommunityOptions() {
  const [communities, setCommunities] = useState<CommunityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await apiFetch("api/admin/communities/options", {
          method: "GET",
        });
        const data = await res.json();
        if (!mounted) return;
        if (res.ok) {
          setCommunities(data.communities ?? []);
        } else {
          setError(data.msg ?? "Failed to load communities");
        }
      } catch {
        if (mounted) setError("Failed to load communities");
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
