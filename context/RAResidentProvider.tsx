"use client";
import { createContext, useContext } from "react";
import type { ResidentLean } from "@/db/resident.model";
import type { RoomLean } from "@/db/room.model";
import { UserType } from "@/db/user.model";
import { CommunityLean } from "@/db/community.models";
import { IncidentLean } from "@/db/incident.model";
import { RoomcheckLean, InspectionSession } from "@/db/roomcheck.model";

interface ResidentsContextType {
  residents: ResidentLean[];
  rooms: RoomLean[];
  user: UserType;
  vacancy: RoomLean[];
  community: CommunityLean[];
  incidents: IncidentLean[];
  roomChecked: RoomcheckLean[];
  walkthroughs: InspectionSession[];
  sessionId: string | null;
}

export const ResidentsContext = createContext<ResidentsContextType | null>(
  null,
);

export function useResidents() {
  const context = useContext(ResidentsContext);

  if (!context) {
    throw new Error("useResidents must be used within a ResidentsProvider");
  }
  return context;
}
