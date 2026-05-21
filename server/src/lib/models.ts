/**
 * Re-exports Mongoose models from the shared /db folder.
 * Resolves ESM default-import interop when the server (type: module) imports project models.
 */
import type { Document, Model } from "mongoose";

import userModule, { type IUser } from "../../../db/user.model.js";
import authorizedModule, {
  type IAuthorized,
} from "../../../db/authorizedAccounts.model.js";
import residentModule from "../../../db/resident.model.js";
import roomModule, { type IRoom } from "../../../db/room.model.js";
import communityModule from "../../../db/community.models.js";
import incidentModule, { type IIncident } from "../../../db/incident.model.js";
import roomcheckModule from "../../../db/roomcheck.model.js";
import sectionStaffModule from "../../../db/sectionStaff.model.js";

function resolveModel<T extends Document>(mod: unknown): Model<T> {
  const candidate = mod as { default?: Model<T> };
  return (candidate.default ?? mod) as Model<T>;
}

export const User = resolveModel<IUser>(userModule);
export const AuthorizedUser = resolveModel<IAuthorized>(authorizedModule);
export const Resident = resolveModel<Document>(residentModule);
export const Room = resolveModel<IRoom>(roomModule);
export const Community = resolveModel<Document>(communityModule);
export const Incident = resolveModel<IIncident>(incidentModule);
export const Roomcheck = resolveModel<Document>(roomcheckModule);
export const SectionStaff = resolveModel<Document>(sectionStaffModule);

export type { IUser, IAuthorized, IRoom, IIncident };
export type { RoomLean } from "../../../db/room.model.js";
export type { CommunityLean } from "../../../db/community.models.js";
export type { IncidentLean } from "../../../db/incident.model.js";
export type { ResidentLean } from "../../../db/resident.model.js";
export type { RoomcheckLean } from "../../../db/roomcheck.model.js";
