"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import SAHeader from "@/components/sa/SAHeader";
import SABottomNav from "@/components/sa/SABottomNav";
import { SASessionProvider } from "@/context/SASessionContext";
import ListSkeleton from "@/components/housing/ListSkeleton";
import { apiFetch } from "@/lib/api-client";
import type { SACommunityDetail, SADashboardStats, SAUser } from "@/types/sa";

export default function SALayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [phase, setPhase] = useState<"auth" | "session" | "ready">("auth");
  const [session, setSession] = useState<{
    user: SAUser;
    community: SACommunityDetail;
    stats: SADashboardStats;
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
        if (verifyData.user?.role !== "SA") {
          router.replace("/login");
          return;
        }

        setPhase("session");

        const dashRes = await apiFetch("api/sa/dashboard", { method: "GET" });
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
    <SASessionProvider value={session}>
      <div className="flex flex-col h-dvh">
        <SAHeader />
        <Separator />
        <div className="px-2 py-2 flex-1 overflow-y-auto">{children}</div>
        <SABottomNav />
      </div>
    </SASessionProvider>
  );
}
