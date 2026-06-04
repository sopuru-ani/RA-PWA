import type { Response } from "express";
import { connectDB } from "../../lib/connect.js";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { requirePrimaryCommunity } from "../../lib/community-scope.js";
import { getCommunityDetail, getCommunityOverviewStats } from "../../services/housing/community.service.js";
import { ResidentAdditionRequest } from "../../lib/models.js";

export async function getDashboard(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const dbUser = req.dbUser!;
  const community = requirePrimaryCommunity(dbUser);

  const [detail, stats, myPending] = await Promise.all([
    getCommunityDetail(community),
    getCommunityOverviewStats(community),
    ResidentAdditionRequest.countDocuments({
      submittedBy: dbUser._id,
      status: "pending",
    }),
  ]);

  if (!detail) {
    res.status(404).json({ msg: "Community not found" });
    return;
  }

  res.status(200).json({
    msg: "GA dashboard loaded",
    user: {
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      role: dbUser.role,
      email: dbUser.email,
    },
    community: detail,
    stats: {
      ...stats,
      myPendingRequests: myPending,
    },
  });
}
