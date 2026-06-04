"use client";

import { createContext, useContext, type ReactNode } from "react";
import type {
  SACommunityDetail,
  SADashboardStats,
  SAUser,
} from "@/types/sa";

type SASessionValue = {
  user: SAUser;
  community: SACommunityDetail;
  stats: SADashboardStats;
};

const SASessionContext = createContext<SASessionValue | null>(null);

export function SASessionProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: SASessionValue;
}) {
  return (
    <SASessionContext.Provider value={value}>{children}</SASessionContext.Provider>
  );
}

export function useSASession(): SASessionValue {
  const ctx = useContext(SASessionContext);
  if (!ctx) {
    throw new Error("useSASession must be used within SASessionProvider");
  }
  return ctx;
}
