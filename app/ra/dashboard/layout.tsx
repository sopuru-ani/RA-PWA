"use client";
import { ReactNode, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { ResidentsContext } from "@/context/RAResidentProvider";

import { Separator } from "@/components/ui/separator";
import RABottomNav from "@/components/RA/RABottomNav";
import RAHeader from "@/components/RA/RAHeader";

import type { ResidentLean } from "@/db/resident.model";
import type { RoomLean } from "@/db/room.model";
import type { UserType } from "@/db/user.model";
import { CommunityLean } from "@/db/community.models";
import { IncidentLean } from "@/db/incident.model";
import { RoomcheckLean, InspectionSession } from "@/db/roomcheck.model";
import RADashboardSkeleton from "@/components/RA/RADashboardSkeleton";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL_LAN;
function layout({ children }: { children: ReactNode }) {
  const router = useRouter();
  // then in your component

  const defaultUser: UserType = {
    firstName: "",
    lastName: "",
    assignment: [""],
    community: [""],
    role: "",
  };

  const [residents, setResidents] = useState<ResidentLean[]>([]);
  const [rooms, setRooms] = useState<RoomLean[]>([]);
  const [user, setUser] = useState<UserType>(defaultUser);
  const [community, setCommunity] = useState<CommunityLean[]>([]);
  const [incidents, setIncidents] = useState<IncidentLean[]>([]);
  const [roomChecked, setRoomChecked] = useState<RoomcheckLean[]>([]);
  const [walkthroughs, setWalkthroughs] = useState<InspectionSession[]>([]);
  const [vacancy, setVacancy] = useState<RoomLean[]>([]);
  const [loading, setLoading] = useState(true);

  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchResidents() {
      try {
        const response = await fetch(`${BASE_URL}api/ra/dashboard`, {
          method: "GET",
          credentials: "include",
        });
        const result: {
          msg: string;
          residents: ResidentLean[];
          rooms: RoomLean[];
          user: UserType;
          communityInfo: CommunityLean[];
          incidents: IncidentLean[];
          roomsChecked: RoomcheckLean;
          walkthroughs: InspectionSession[];
        } = await response.json();

        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        if (isMounted) {
          setResidents(result.residents);
          setRooms(result.rooms);
          setUser(result.user);
          setCommunity(result.communityInfo);
          setIncidents(result.incidents);
          setWalkthroughs(result.walkthroughs);
          if (result.roomsChecked) {
            setSessionId(result.roomsChecked.inspectionSession || null);
          }

          const vacancies = result.rooms.filter(
            (room) => Number(room.vacancy) > 0,
          );

          setVacancy(vacancies);
        }
      } catch (error) {
        console.error("Failed to fetch residents:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchResidents();

    return () => {
      isMounted = false;
    };
  }, []);
  if (loading) return <RADashboardSkeleton />;
  return (
    <>
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
        }}
      >
        <div className="flex flex-col h-dvh max-h-dvh">
          <RAHeader user={user} vacancies={vacancy} residents={residents} />

          <Separator />
          <div className="px-2 py-2 flex-1 overflow-y-auto">{children}</div>
          <RABottomNav />
        </div>
      </ResidentsContext.Provider>
    </>
  );
}

export default layout;
