import type { HydratedDocument } from "mongoose";
import type { IUser } from "../../db/user.model.js";
export function getPrimaryCommunity(user: Pick<IUser, "community">): string | null {
  const c = user.community ?? [];
  return c.length > 0 ? c[0] : null;
}

export function assertCommunityAccess(
  user: Pick<IUser, "community">,
  community: string,
): void {
  const allowed = user.community ?? [];
  if (!allowed.includes(community)) {
    const err = new Error("Forbidden: community not in scope");
    (err as Error & { statusCode: number }).statusCode = 403;
    throw err;
  }
}

export function assertSectionInCommunity(
  communityDoc: { section?: string[] },
  section: string,
): void {
  const sections = communityDoc.section ?? [];
  const ok = sections.some((s) => s.toLowerCase() === section.toLowerCase());
  if (!ok) {
    const err = new Error("Invalid section for this community");
    (err as Error & { statusCode: number }).statusCode = 400;
    throw err;
  }
}

export const INCIDENT_SUBMIT_ROLES = ["RA", "GA", "SA"] as const;

export type IncidentSubmitRole = (typeof INCIDENT_SUBMIT_ROLES)[number];

export function canSubmitIncident(role: string): role is IncidentSubmitRole {
  return (INCIDENT_SUBMIT_ROLES as readonly string[]).includes(role);
}

export function scopeError(
  message: string,
  statusCode: number,
): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

export function requirePrimaryCommunity(
  user: HydratedDocument<IUser>,
): string {
  const community = getPrimaryCommunity(user);
  if (!community) {
    throw scopeError("No community assigned to this account", 403);
  }
  return community;
}
