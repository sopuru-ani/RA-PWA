"use client";

import { createContext, useContext } from "react";
import type { CommunityLean } from "@/db/community.models";
import type { IncidentLean } from "@/db/incident.model";
import type { RoomLean } from "@/db/room.model";
import type { UserType } from "@/db/user.model";

type GAWorkspaceValue = {
  user: UserType;
  communityInfo: CommunityLean[];
  rooms: RoomLean[];
  incidents: IncidentLean[];
  refreshIncidents: () => Promise<void>;
};

export const GAWorkspaceContext = createContext<GAWorkspaceValue | null>(null);

export function useGAWorkspace() {
  const ctx = useContext(GAWorkspaceContext);
  if (!ctx) {
    throw new Error("useGAWorkspace must be used within GAWorkspaceProvider");
  }
  return ctx;
}
