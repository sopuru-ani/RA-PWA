import type { HydratedDocument } from "mongoose";
import type { IUser } from "../../db/user.model.js";
import type { IncidentLean } from "../../db/incident.model.js";
import { getPrimaryCommunity, scopeError } from "./community-scope.js";

export type IncidentListScope = "community" | "own";

/** Mongo filter for listing incidents for the given user */
export function buildIncidentListFilter(
  user: Pick<IUser, "role" | "community" | "_id">,
): Record<string, unknown> {
  const community = getPrimaryCommunity(user);
  if (!community) {
    throw scopeError("No community assigned", 403);
  }

  if (user.role === "SA") {
    return {
      community,
      reporterUserId: user._id,
    };
  }

  return { community };
}

export function getIncidentListScope(role: IUser["role"]): IncidentListScope {
  return role === "SA" ? "own" : "community";
}

function assertSameCommunity(
  user: Pick<IUser, "community">,
  incident: Pick<IncidentLean, "community">,
): void {
  const primary = getPrimaryCommunity(user);
  if (
    incident.community &&
    primary &&
    incident.community !== primary
  ) {
    throw scopeError("Unauthorized to access this incident", 403);
  }
}

function assertOwnIncident(
  user: Pick<IUser, "_id">,
  incident: Pick<IncidentLean, "reporterUserId">,
): void {
  const reporterId = incident.reporterUserId
    ? String(incident.reporterUserId)
    : null;
  if (!reporterId || reporterId !== String(user._id)) {
    throw scopeError("You can only modify incidents you submitted", 403);
  }
}

export function assertCanViewIncident(
  user: HydratedDocument<IUser>,
  incident: IncidentLean,
): void {
  assertSameCommunity(user, incident);
  if (user.role === "SA") {
    assertOwnIncident(user, incident);
  }
}

export function assertCanModifyIncident(
  user: HydratedDocument<IUser>,
  incident: IncidentLean,
): void {
  assertCanViewIncident(user, incident);
}

export function assertCanDeleteIncident(
  user: HydratedDocument<IUser>,
  incident: IncidentLean,
): void {
  assertCanModifyIncident(user, incident);
}
