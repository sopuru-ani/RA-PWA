"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminNav from "@/components/admin/AdminNav";
import { AdminSessionProvider } from "@/context/AdminSessionContext";
import ListSkeleton from "@/components/housing/ListSkeleton";
import { apiFetch } from "@/lib/api-client";
import type { AdminDashboardStats, AdminUser } from "@/types/admin";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<"auth" | "session" | "ready">("auth");
  const [session, setSession] = useState<{
    user: AdminUser;
    stats: AdminDashboardStats;
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
        if (verifyData.user?.role !== "Admin") {
          router.replace("/login");
          return;
        }

        setPhase("session");

        const dashRes = await apiFetch("api/admin/dashboard", { method: "GET" });
        if (dashRes.status === 401 || dashRes.status === 403) {
          router.replace("/login");
          return;
        }

        const dashData = await dashRes.json();
        if (mounted) {
          setSession({ user: dashData.user, stats: dashData.stats });
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
    <AdminSessionProvider value={session}>
      <div className="flex flex-col h-dvh">
        <AdminHeader />
        <Separator />
        <div className="px-2 py-2 flex-1 overflow-y-auto">{children}</div>
        <AdminNav />
      </div>
    </AdminSessionProvider>
  );
}
