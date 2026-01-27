"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL_LAN;

/**
 * Simple auth guard hook.
 * - Calls GET `${BASE_URL}api/auth/verify` with credentials.
 * - On 401, redirects to /login.
 * - Returns `true` while checking auth, `false` once verified.
 */
export function useVerifyAuth() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch(`${BASE_URL}api/auth/verify`, {
          method: "GET",
          credentials: "include",
        });

        if (res.status === 401) {
          router.replace("/login");
          return;
        }

        setCheckingAuth(false);
      } catch (err) {
        console.error("Auth check failed", err);
        router.replace("/login");
      }
    };

    verify();
  }, [router]);

  return checkingAuth;
}
