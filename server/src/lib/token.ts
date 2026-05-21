import type { Request } from "express";

/** JWT from httpOnly cookie (same-origin) or Authorization header (cross-origin dev) */
export function getTokenFromRequest(req: Request): string | undefined {
  if (req.cookies?.token) {
    return req.cookies.token;
  }

  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7);
  }

  return undefined;
}
