import type { Request, Response, NextFunction } from "express";

/** Central error handler — returns JSON consistent with legacy Next.js API routes */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const statusCode =
    err &&
    typeof err === "object" &&
    "statusCode" in err &&
    typeof (err as { statusCode: unknown }).statusCode === "number"
      ? (err as { statusCode: number }).statusCode
      : 500;

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    msg:
      err instanceof Error
        ? err.message
        : statusCode >= 500
          ? "Internal Server Error"
          : "Request failed",
    error: err instanceof Error ? err.message : "Unknown Error",
  });
}
