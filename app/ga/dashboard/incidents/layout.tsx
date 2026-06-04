"use client";

import { ReactNode, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GAWorkspaceContext } from "@/context/GAWorkspaceContext";
import { apiFetch } from "@/lib/api-client";
import ListSkeleton from "@/components/housing/ListSkeleton";
import type { CommunityLean } from "@/db/community.models";
import type { IncidentLean } from "@/db/incident.model";
import type { RoomLean } from "@/db/room.model";
import type { UserType } from "@/db/user.model";

export default function GAIncidentsLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<{
    user: UserType;
    communityInfo: CommunityLean[];
    rooms: RoomLean[];
    incidents: IncidentLean[];
  } | null>(null);

  const load = useCallback(async () => {
    const res = await apiFetch("api/ga/workspace", { method: "GET" });
    if (res.status === 401) {
      router.replace("/login");
      return;
    }
    const data = await res.json();
    if (res.ok) {
      setWorkspace({
        user: data.user,
        communityInfo: data.communityInfo,
        rooms: data.rooms,
        incidents: data.incidents,
      });
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !workspace) return <ListSkeleton rows={6} />;

  return (
    <GAWorkspaceContext.Provider
      value={{
        ...workspace,
        refreshIncidents: async () => {
          const res = await apiFetch("api/ga/incidents", { method: "GET" });
          const data = await res.json();
          if (res.ok) {
            setWorkspace((w) =>
              w ? { ...w, incidents: data.incidents } : w,
            );
          }
        },
      }}
    >
      {children}
    </GAWorkspaceContext.Provider>
  );
}
