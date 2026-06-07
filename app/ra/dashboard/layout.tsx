"use client";
import { ReactNode, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

import { ResidentsContext } from "@/context/RAResidentProvider";

import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import RABottomNav from "@/components/RA/RABottomNav";
import RAHeader from "@/components/RA/RAHeader";

import type { ResidentLean } from "@/db/resident.model";
import type { RoomWithVacancy } from "@/db/room.model";
import type { UserType } from "@/db/user.model";
import { CommunityLean } from "@/db/community.models";
import { IncidentLean } from "@/db/incident.model";
import { RoomcheckLean, InspectionSession } from "@/db/roomcheck.model";
import RADashboardSkeleton from "@/components/RA/RADashboardSkeleton";
import { apiFetch } from "@/lib/api-client";
import type { ProgramStats } from "@/types/programs";

type DashboardPayload = {
  msg: string;
  residents: ResidentLean[];
  rooms: RoomWithVacancy[];
  user: UserType;
  communityInfo: CommunityLean[];
  incidents: IncidentLean[];
  roomsChecked: RoomcheckLean;
  walkthroughs: InspectionSession[];
  programStats?: ProgramStats;
};

function layout({ children }: { children: ReactNode }) {
  const router = useRouter();

  const defaultUser: UserType = {
    firstName: "",
    lastName: "",
    assignment: [""],
    community: [""],
    role: "",
  };

  const [residents, setResidents] = useState<ResidentLean[]>([]);
  const [rooms, setRooms] = useState<RoomWithVacancy[]>([]);
  const [user, setUser] = useState<UserType>(defaultUser);
  const [community, setCommunity] = useState<CommunityLean[]>([]);
  const [incidents, setIncidents] = useState<IncidentLean[]>([]);
  const [roomChecked, setRoomChecked] = useState<RoomcheckLean[]>([]);
  const [walkthroughs, setWalkthroughs] = useState<InspectionSession[]>([]);
  const [vacancy, setVacancy] = useState<RoomWithVacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [programStats, setProgramStats] = useState<ProgramStats | undefined>();

  const applyDashboardResult = useCallback((result: DashboardPayload) => {
    setResidents(result.residents);
    setRooms(result.rooms);
    setUser(result.user);
    setCommunity(result.communityInfo);
    setIncidents(result.incidents);
    setWalkthroughs(result.walkthroughs);
    if (result.roomsChecked) {
      setSessionId(result.roomsChecked.inspectionSession || null);
    }
    setVacancy(result.rooms.filter((room) => Number(room.vacancy) > 0));
    setProgramStats(result.programStats);
  }, []);

  const loadDashboard = useCallback(async () => {
    setFetchError(null);
    try {
      const response = await apiFetch("api/ra/dashboard", {
        method: "GET",
      });
      const result: DashboardPayload = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setFetchError(result.msg ?? "Failed to load dashboard");
        return;
      }

      applyDashboardResult(result);
    } catch (error) {
      console.error("Failed to fetch residents:", error);
      setFetchError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [applyDashboardResult, router]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const refreshIncidents = useCallback(async () => {
    try {
      const response = await apiFetch("api/ra/dashboard", { method: "GET" });
      const result: DashboardPayload = await response.json();
      if (response.ok) {
        setIncidents(result.incidents);
      }
    } catch (error) {
      console.error("Failed to refresh incidents:", error);
    }
  }, []);

  if (loading) return <RADashboardSkeleton />;

  if (fetchError) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 px-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
        <Button className="text-white" onClick={() => {
          setLoading(true);
          loadDashboard();
        }}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <ResidentsContext.Provider
      value={{
        residents,
        rooms,
        user,
        vacancy,
        community,
        incidents,
        roomChecked,
        sessionId,
        walkthroughs,
        programStats,
        refreshIncidents,
      }}
    >
      <div className="flex flex-col h-dvh">
        <RAHeader user={user} vacancies={vacancy} residents={residents} />

        <Separator />
        <div className="relative min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {children}
        </div>
        <RABottomNav />
      </div>
    </ResidentsContext.Provider>
  );
}

export default layout;
