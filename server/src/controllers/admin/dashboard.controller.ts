import type { Response } from "express";
import { connectDB } from "../../lib/connect.js";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import {
  User,
  AuthorizedUser,
  Resident,
  Community,
  SectionStaff,
  ResidentChangeRequest,
} from "../../lib/models.js";
import { getProgramStats } from "../../services/programs/program.service.js";

export async function getDashboard(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();

  try {
    const dbUser = req.dbUser!;

    const [
      communityCount,
      residentCount,
      staffByRole,
      pendingInvites,
      sectionCount,
      pendingResidentRequests,
      programStats,
    ] = await Promise.all([
      Community.countDocuments(),
      Resident.countDocuments(),
      User.aggregate<{ _id: string; count: number }>([
        { $match: { role: { $in: ["RA", "GA", "SA", "Admin"] } } },
        { $group: { _id: "$role", count: { $sum: 1 } } },
      ]),
      AuthorizedUser.countDocuments({
        isActive: true,
        email: {
          $nin: await User.find().distinct("email"),
        },
      }),
      SectionStaff.countDocuments(),
      ResidentChangeRequest.countDocuments({ status: "pending" }),
      getProgramStats(dbUser),
    ]);

    const roleCounts = Object.fromEntries(
      staffByRole.map((r) => [r._id, r.count]),
    );

    res.status(200).json({
      msg: "Admin dashboard loaded",
      user: {
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        role: dbUser.role,
        email: dbUser.email,
      },
      stats: {
        communities: communityCount,
        residents: residentCount,
        sections: sectionCount,
        pendingInvites,
        pendingResidentRequests,
        staff: {
          RA: roleCounts.RA ?? 0,
          GA: roleCounts.GA ?? 0,
          SA: roleCounts.SA ?? 0,
          Admin: roleCounts.Admin ?? 0,
        },
        programStats,
      },
    });
  } catch (error) {
    res.status(500).json({
      msg: "Internal Server Error",
      error: error instanceof Error ? error.message : "Unknown Error",
    });
  }
}
