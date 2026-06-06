"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import GAHeader from "@/components/ga/GAHeader";
import GABottomNav from "@/components/ga/GABottomNav";
import { GASessionProvider } from "@/context/GASessionContext";
import ListSkeleton from "@/components/housing/ListSkeleton";
import { apiFetch } from "@/lib/api-client";
import type { GACommunityDetail, GADashboardStats, GAUser } from "@/types/ga";

export default function GALayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [phase, setPhase] = useState<"auth" | "session" | "ready">("auth");
  const [session, setSession] = useState<{
    user: GAUser;
    community: GACommunityDetail;
    stats: GADashboardStats;
  } | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const verifyRes = await apiFetch("api/auth/verify", { method: "GET" });
        if (!mounted) return;

        if (verifyRes.status === 401) {
          router.replace("/login");
          return;
        }

        const verifyData = await verifyRes.json();
        if (verifyData.user?.role !== "GA") {
          router.replace("/login");
          return;
        }

        setPhase("session");

        const dashRes = await apiFetch("api/ga/dashboard", { method: "GET" });
        if (dashRes.status === 401 || dashRes.status === 403) {
          router.replace("/login");
          return;
        }

        const dashData = await dashRes.json();
        if (mounted) {
          setSession({
            user: dashData.user,
            community: dashData.community,
            stats: dashData.stats,
          });
          setPhase("ready");
        }
      } catch {
        router.replace("/login");
      }
    }

    init();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (phase !== "ready" || !session) {
    return <ListSkeleton rows={phase === "auth" ? 4 : 8} />;
  }

  return (
    <GASessionProvider value={session}>
      <div className="flex flex-col h-dvh">
        <GAHeader />
        <Separator />
        <div className="relative min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {children}
        </div>
        <GABottomNav />
      </div>
    </GASessionProvider>
  );
}
