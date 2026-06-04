import {
  Community,
  Resident,
  SectionStaff,
  CommunityStaff,
  User,
  ResidentChangeRequest,
  Incident,
  type CommunityLean,
  type SectionStaffLean,
  type CommunityStaffLean,
} from "../../lib/models.js";

export async function getCommunityDetail(communityName: string) {
  const community = await Community.findOne({
    community: communityName,
  }).lean<CommunityLean>();

  if (!community) return null;

  const [sectionStaff, residentCount, gaStaff, saStaff, raCount] =
    await Promise.all([
      SectionStaff.find({ community: communityName }).lean<SectionStaffLean[]>(),
      Resident.countDocuments({ community: communityName }),
      CommunityStaff.find({
        community: communityName,
        role: "GA",
        isActive: true,
      }).lean<CommunityStaffLean[]>(),
      CommunityStaff.find({
        community: communityName,
        role: "SA",
        isActive: true,
      }).lean<CommunityStaffLean[]>(),
      User.countDocuments({ role: "RA", community: communityName }),
    ]);

  return {
    name: community.community,
    sections: community.section ?? [],
    residentCount,
    sectionStaff,
    gaStaff,
    saStaff,
    raCount: sectionStaff.length || raCount,
  };
}

export async function getCommunityOverviewStats(communityName: string) {
  const [residentCount, sectionStaff, pendingRequests, openIncidents] =
    await Promise.all([
      Resident.countDocuments({ community: communityName }),
      SectionStaff.countDocuments({ community: communityName }),
      ResidentChangeRequest.countDocuments({
        community: communityName,
        status: "pending",
      }),
      Incident.countDocuments({
        community: communityName,
        $or: [{ resolved: false }, { resolved: { $exists: false } }],
      }),
    ]);

  return {
    residents: residentCount,
    sections: sectionStaff,
    pendingRequests,
    openIncidents,
  };
}
