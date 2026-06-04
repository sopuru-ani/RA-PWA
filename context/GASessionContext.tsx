"use client";

import { createContext, useContext, type ReactNode } from "react";
import type {
  GACommunityDetail,
  GADashboardStats,
  GAUser,
} from "@/types/ga";

type GASessionValue = {
  user: GAUser;
  community: GACommunityDetail;
  stats: GADashboardStats;
};

const GASessionContext = createContext<GASessionValue | null>(null);

export function GASessionProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: GASessionValue;
}) {
  return (
    <GASessionContext.Provider value={value}>{children}</GASessionContext.Provider>
  );
}

export function useGASession(): GASessionValue {
  const ctx = useContext(GASessionContext);
  if (!ctx) {
    throw new Error("useGASession must be used within GASessionProvider");
  }
  return ctx;
}
