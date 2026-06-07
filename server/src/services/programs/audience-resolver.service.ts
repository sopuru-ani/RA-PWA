import type { HydratedDocument } from "mongoose";
import type { IUser } from "../../../db/user.model.js";
import type { IProgram } from "../../../db/program.model.js";
import {
  resolveStaffUserIds,
  type StaffRole,
} from "./community-staff-resolver.service.js";

export async function resolveAudienceUserIds(
  program: Pick<IProgram, "audience" | "communities">,
): Promise<string[]> {
  const { audience, communities } = program;
  const programCommunities = communities ?? [];

  switch (audience.type) {
    case "all_staff":
      return resolveStaffUserIds({
        communities: programCommunities,
        roles: ["RA", "GA", "SA", "Admin"],
      });

    case "all_ras":
      return resolveStaffUserIds({
        communities: programCommunities,
        roles: ["RA"],
      });

    case "all_gas":
      return resolveStaffUserIds({
        communities: programCommunities,
        roles: ["GA"],
      });

    case "selected_users":
      return (audience.userIds ?? []).map((id) => String(id));

    case "selected_communities": {
      if (programCommunities.length === 0) {
        return [];
      }
      return resolveStaffUserIds({
        communities: programCommunities,
        roles: ["RA", "GA", "SA"],
      });
    }

    case "community_staff": {
      const roles: StaffRole[] = audience.roles?.length
        ? audience.roles
        : ["RA", "GA", "SA"];
      return resolveStaffUserIds({
        communities: programCommunities,
        roles,
      });
    }

    default:
      return [];
  }
}

export function assertCommunitiesInScope(
  _user: HydratedDocument<IUser>,
  _communities: string[],
): void {
  // Program hosts may invite any community; audience is not limited by creator role.
}
