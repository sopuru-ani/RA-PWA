"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import type { AdminDashboardStats, AdminUser } from "@/types/admin";

type AdminSessionValue = {
  user: AdminUser;
  stats: AdminDashboardStats;
};

const AdminSessionContext = createContext<AdminSessionValue | null>(null);

export function AdminSessionProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: AdminSessionValue;
}) {
  return (
    <AdminSessionContext.Provider value={value}>
      {children}
    </AdminSessionContext.Provider>
  );
}

export function useAdminSession(): AdminSessionValue {
  const ctx = useContext(AdminSessionContext);
  if (!ctx) {
    throw new Error("useAdminSession must be used within AdminSessionProvider");
  }
  return ctx;
}
