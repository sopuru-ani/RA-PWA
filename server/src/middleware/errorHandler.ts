import type { Request, Response, NextFunction } from "express";

/** Central error handler — returns JSON consistent with legacy Next.js API routes */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error(err);
  res.status(500).json({
    msg: "Internal Server Error",
    error: err instanceof Error ? err.message : "Unknown Error",
  });
}
