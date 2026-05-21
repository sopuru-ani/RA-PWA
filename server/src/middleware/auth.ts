import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { connectDB } from "../lib/connect.js";
import { getTokenFromRequest } from "../lib/token.js";
import type { HydratedDocument } from "mongoose";
import { User, type IUser } from "../lib/models.js";

export interface AuthPayload {
  userId: string;
}

export interface AuthenticatedRequest extends Request {
  auth?: AuthPayload;
  dbUser?: HydratedDocument<IUser>;
}

/** Reads JWT from the httpOnly `token` cookie and attaches user info to the request */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = getTokenFromRequest(req);

  if (!token) {
    res.status(401).json({ msg: "Unauthorized" });
    return;
  }

  try {
    await connectDB();
    const decoded = jwt.verify(token, env.jwtSecret) as AuthPayload;
    const dbUser = await User.findById(decoded.userId);

    if (!dbUser) {
      res.status(401).json({ msg: "Unauthorized" });
      return;
    }

    req.auth = decoded;
    req.dbUser = dbUser;
    next();
  } catch (err) {
    if (
      err instanceof jwt.JsonWebTokenError ||
      err instanceof jwt.TokenExpiredError
    ) {
      res.status(401).json({ msg: "Unauthorized" });
      return;
    }
    next(err);
  }
}
