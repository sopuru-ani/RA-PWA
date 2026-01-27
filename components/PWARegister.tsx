"use client";

import { useEffect } from "react";

/**
 * Ensures the service worker at /sw.js is registered in production.
 * This is useful when next-pwa doesn't auto-register (e.g. with Turbopack/App Router).
 */
export default function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const existing = await navigator.serviceWorker.getRegistration();
        if (existing) {
          return; // already registered
        }

        await navigator.serviceWorker.register("/sw.js");
      } catch (err) {
        console.error("Service worker registration failed", err);
      }
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
