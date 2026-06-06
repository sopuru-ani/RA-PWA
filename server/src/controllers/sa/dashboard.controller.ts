import type { Response } from "express";
import { connectDB } from "../../lib/connect.js";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { requirePrimaryCommunity } from "../../lib/community-scope.js";
import { buildIncidentListFilter } from "../../lib/incident-permissions.js";
import {
  getCommunityDetail,
  getCommunityOverviewStats,
} from "../../services/housing/community.service.js";
import { Incident } from "../../lib/models.js";
import { getProgramStats } from "../../services/programs/program.service.js";

export async function getDashboard(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const dbUser = req.dbUser!;
  const community = requirePrimaryCommunity(dbUser);

  const [detail, stats, myIncidents, myOpenIncidents, programStats] =
    await Promise.all([
      getCommunityDetail(community),
      getCommunityOverviewStats(community),
      Incident.countDocuments(buildIncidentListFilter(dbUser)),
      Incident.countDocuments({
        ...buildIncidentListFilter(dbUser),
        $or: [{ resolved: false }, { resolved: { $exists: false } }],
      }),
      getProgramStats(dbUser),
    ]);

  if (!detail) {
    res.status(404).json({ msg: "Community not found" });
    return;
  }

  res.status(200).json({
    msg: "SA dashboard loaded",
    user: {
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      role: dbUser.role,
      email: dbUser.email,
      assignment: dbUser.assignment ?? [],
      community: dbUser.community ?? [],
    },
    community: detail,
    stats: {
      residents: stats.residents,
      sections: stats.sections,
      communityOpenIncidents: stats.openIncidents,
      myIncidents,
      myOpenIncidents,
      programStats,
    },
  });
}
