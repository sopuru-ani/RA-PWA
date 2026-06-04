import type { Response } from "express";
import { connectDB } from "../../lib/connect.js";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import {
  Community,
  Resident,
  Room,
  SectionStaff,
  User,
  CommunityStaff,
  type CommunityLean,
  type SectionStaffLean,
  type CommunityStaffLean,
} from "../../lib/models.js";
import { getSectionSummaries } from "../../services/admin/structure-management.service.js";

/** Lightweight list for form pickers (community + sections) */
export async function listCommunityOptions(
  _req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const communities = await Community.find().lean<CommunityLean[]>();
  res.status(200).json({
    msg: "Community options",
    communities: communities.map((c) => ({
      name: c.community,
      sections: c.section ?? [],
    })),
  });
}

export async function listCommunities(
  _req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();

  const communities = await Community.find().lean<CommunityLean[]>();

  const summaries = await Promise.all(
    communities.map(async (c) => {
      const communityName = c.community;
      const [residentCount, sectionStaff, gaStaff, saStaff, raUsers] =
        await Promise.all([
          Resident.countDocuments({ community: communityName }),
          SectionStaff.find({ community: communityName }).lean<SectionStaffLean[]>(),
          CommunityStaff.find({
            community: communityName,
            role: "GA",
            isActive: true,
          }).lean(),
          CommunityStaff.find({
            community: communityName,
            role: "SA",
            isActive: true,
          }).lean(),
          User.countDocuments({
            role: "RA",
            community: communityName,
          }),
        ]);

      return {
        community: communityName,
        sections: c.section ?? [],
        sectionCount: (c.section ?? []).length,
        residentCount,
        raCount: sectionStaff.length || raUsers,
        gaCount: gaStaff.length,
        saCount: saStaff.length,
      };
    }),
  );

  res.status(200).json({ msg: "Communities", communities: summaries });
}

export async function getCommunity(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const communityName = decodeURIComponent(req.params.community);

  const community = await Community.findOne({
    community: communityName,
  }).lean<CommunityLean>();

  if (!community) {
    res.status(404).json({ msg: "Community not found" });
    return;
  }

  const [sectionStaff, residents, gaStaff, saStaff, roomCount, sectionSummaries] =
    await Promise.all([
      SectionStaff.find({ community: communityName }).lean<SectionStaffLean[]>(),
      Resident.countDocuments({ community: communityName }),
      CommunityStaff.find({ community: communityName, role: "GA" }).lean<CommunityStaffLean[]>(),
      CommunityStaff.find({ community: communityName, role: "SA" }).lean<CommunityStaffLean[]>(),
      Room.countDocuments({ community: communityName }),
      getSectionSummaries(communityName),
    ]);

  res.status(200).json({
    msg: "Community detail",
    community: {
      name: community.community,
      sections: community.section ?? [],
      residentCount: residents,
      roomCount,
      sectionSummaries,
      sectionStaff,
      gaStaff,
      saStaff,
    },
  });
}
