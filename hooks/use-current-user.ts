"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

export type CurrentUser = {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  community: string[] | null;
  assignment: string[] | null;
};

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await apiFetch("api/auth/verify", { method: "GET" });
        const data = await res.json();
        if (!mounted) return;
        if (res.ok && data.user) {
          setUser(data.user);
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

  return { user, loading };
}
