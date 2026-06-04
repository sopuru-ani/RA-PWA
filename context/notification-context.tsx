"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { AnimatePresence } from "framer-motion";

import Notifications from "@/components/Notifications";

export type NotifType = "error" | "success" | "neutral";

export interface NotifItemsProps {
  id: number;

  // content
  msg: string;
  type?: NotifType;

  // behavior
  closable?: boolean;
  duration?: number | null;
}

interface NotificationContextType {
  notif: NotifItemsProps | null;

  show: (notif: Omit<NotifItemsProps, "id">) => void;

  hide: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notif, setNotif] = useState<NotifItemsProps | null>(null);
  const pathname = usePathname();

  function show(data: Omit<NotifItemsProps, "id">) {
    setNotif({
      id: Date.now(),

      // default appearance
      type: "neutral",

      // default behavior
      closable: false,
      duration: 3000,

      ...data,
    });
  }

  function hide() {
    setNotif(null);
  }

  // auto-dismiss logic
  useEffect(() => {
    if (!notif) return;

    // null = never auto dismiss
    if (notif.duration === null) return;

    const timer = setTimeout(() => {
      hide();
    }, notif.duration);

    return () => clearTimeout(timer);
  }, [notif]);

  // clear notifications on route change
  useEffect(() => {
    if (!notif) return;
    hide();
  }, [pathname]);

  return (
    <NotificationContext.Provider value={{ notif, show, hide }}>
      {children}

      {/* global notification renderer */}
      <AnimatePresence mode="wait">
        {notif && <Notifications key={notif.id} {...notif} onClose={hide} />}
      </AnimatePresence>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);

  if (!ctx) {
    throw new Error("useNotification must be used inside NotificationProvider");
  }

  return ctx;
}
