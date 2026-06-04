"use client";

import { createContext, useContext } from "react";
import type { CommunityLean } from "@/db/community.models";
import type { IncidentLean } from "@/db/incident.model";
import type { RoomLean } from "@/db/room.model";
import type { UserType } from "@/db/user.model";

type SAWorkspaceValue = {
  user: UserType;
  communityInfo: CommunityLean[];
  rooms: RoomLean[];
  incidents: IncidentLean[];
  refreshIncidents: () => Promise<void>;
};

export const SAWorkspaceContext = createContext<SAWorkspaceValue | null>(null);

export function useSAWorkspace() {
  const ctx = useContext(SAWorkspaceContext);
  if (!ctx) {
    throw new Error("useSAWorkspace must be used within SAWorkspaceProvider");
  }
  return ctx;
}
