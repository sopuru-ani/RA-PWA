import type { Response } from "express";
import { connectDB } from "../../lib/connect.js";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { requirePrimaryCommunity } from "../../lib/community-scope.js";
import {
  Community,
  Incident,
  Room,
  type IncidentLean,
} from "../../lib/models.js";

export async function listIncidents(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const community = requirePrimaryCommunity(req.dbUser!);
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);

  const incidents = await Incident.find({ community })
    .sort({ incidentDate: -1 })
    .limit(limit)
    .lean<IncidentLean[]>();

  res.status(200).json({ msg: "Incidents", incidents });
}

export async function getWorkspace(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const community = requirePrimaryCommunity(req.dbUser!);
  const dbUser = req.dbUser!;

  const [communityInfo, rooms, incidents] = await Promise.all([
    Community.find({ community }).lean(),
    Room.find({ community }).lean(),
    Incident.find({ community }).sort({ incidentDate: -1 }).limit(100).lean(),
  ]);

  res.status(200).json({
    msg: "GA workspace",
    user: {
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      assignment: dbUser.assignment ?? [],
      community: dbUser.community ?? [],
      role: dbUser.role,
    },
    communityInfo,
    rooms,
    incidents,
  });
}
