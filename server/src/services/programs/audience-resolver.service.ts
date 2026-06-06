import type { HydratedDocument } from "mongoose";
import type { IUser } from "../../../db/user.model.js";
import type { IProgram } from "../../../db/program.model.js";
import { User } from "../../lib/models.js";

function activeStaffFilter(): Record<string, unknown> {
  return { isActive: true, role: { $in: ["RA", "GA", "SA", "Admin"] } };
}

export async function resolveAudienceUserIds(
  program: Pick<IProgram, "audience" | "communities">,
): Promise<string[]> {
  const { audience, communities } = program;
  const programCommunities = communities ?? [];

  switch (audience.type) {
    case "all_staff": {
      const users = await User.find(activeStaffFilter()).select("_id").lean();
      return users.map((u) => String(u._id));
    }

    case "all_ras": {
      const filter: Record<string, unknown> = {
        isActive: true,
        role: "RA",
      };
      if (programCommunities.length > 0) {
        filter.community = { $in: programCommunities };
      }
      const users = await User.find(filter).select("_id").lean();
      return users.map((u) => String(u._id));
    }

    case "all_gas": {
      const filter: Record<string, unknown> = {
        isActive: true,
        role: "GA",
      };
      if (programCommunities.length > 0) {
        filter.community = { $in: programCommunities };
      }
      const users = await User.find(filter).select("_id").lean();
      return users.map((u) => String(u._id));
    }

    case "selected_users": {
      return (audience.userIds ?? []).map((id) => String(id));
    }

    case "selected_communities": {
      const targetCommunities = programCommunities;
      if (targetCommunities.length === 0) {
        return [];
      }

      const users = await User.find({
        isActive: true,
        role: { $in: ["RA", "GA", "SA"] },
        community: { $in: targetCommunities },
      })
        .select("_id")
        .lean();
      return users.map((u) => String(u._id));
    }

    case "community_staff": {
      const roles = audience.roles?.length
        ? audience.roles
        : (["RA", "GA", "SA"] as const);
      const filter: Record<string, unknown> = {
        isActive: true,
        role: { $in: roles },
      };
      if (programCommunities.length > 0) {
        filter.community = { $in: programCommunities };
      }
      const users = await User.find(filter).select("_id").lean();
      return users.map((u) => String(u._id));
    }

    default:
      return [];
  }
}

export function assertCommunitiesInScope(
  user: HydratedDocument<IUser>,
  communities: string[],
): void {
  if (user.role === "Admin") return;
  if (communities.length === 0) return;

  const allowed = user.community ?? [];
  const outOfScope = communities.filter((c) => !allowed.includes(c));
  if (outOfScope.length > 0) {
    const err = new Error(
      `Communities out of scope: ${outOfScope.join(", ")}`,
    ) as Error & { statusCode: number };
    err.statusCode = 403;
    throw err;
  }
}
