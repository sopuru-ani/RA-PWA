import type { Response } from "express";
import { connectDB } from "../../lib/connect.js";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { requirePrimaryCommunity } from "../../lib/community-scope.js";
import { getCommunityDetail } from "../../services/housing/community.service.js";

export async function getCommunity(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const community = requirePrimaryCommunity(req.dbUser!);
  const detail = await getCommunityDetail(community);

  if (!detail) {
    res.status(404).json({ msg: "Community not found" });
    return;
  }

  res.status(200).json({ msg: "Community", community: detail });
}
