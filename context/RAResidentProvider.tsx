"use client";
import { createContext, useContext } from "react";
import type { ResidentLean } from "@/db/resident.model";
import type { RoomWithVacancy } from "@/db/room.model";
import { UserType } from "@/db/user.model";
import { CommunityLean } from "@/db/community.models";
import { IncidentLean } from "@/db/incident.model";
import { RoomcheckLean, InspectionSession } from "@/db/roomcheck.model";
import type { ProgramStats } from "@/types/programs";

interface ResidentsContextType {
  residents: ResidentLean[];
  rooms: RoomWithVacancy[];
  user: UserType;
  vacancy: RoomWithVacancy[];
  community: CommunityLean[];
  incidents: IncidentLean[];
  roomChecked: RoomcheckLean[];
  walkthroughs: InspectionSession[];
  sessionId: string | null;
  programStats?: ProgramStats;
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
