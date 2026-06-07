import {
  User,
  SectionStaff,
  CommunityStaff,
  type SectionStaffLean,
} from "../../lib/models.js";

const STAFF_ROLES = ["RA", "GA", "SA", "Admin"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export type ResolvedStaffUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  communities: string[];
};

type ResolveOptions = {
  /** Empty = department-wide (all matching roles). */
  communities: string[];
  roles?: StaffRole[];
};

/** Match staff.service / listStaff: treat missing isActive as active. */
function activeUserFilter(): Record<string, unknown> {
  return { isActive: { $ne: false } };
}

function activeCommunityStaffFilter(): Record<string, unknown> {
  return { isActive: { $ne: false } };
}

function mapUser(u: {
  _id?: unknown;
  fullName: string;
  email: string;
  role: string;
  community?: string[];
}): ResolvedStaffUser {
  return {
    id: String(u._id),
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    communities: u.community ?? [],
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Match a string community field against one or more community names. */
function stringCommunityFilter(communities: string[]): Record<string, unknown> {
  return { community: { $in: communities } };
}

/** Match User.community string[] containing any of the given names. */
function userCommunityFilter(communities: string[]): Record<string, unknown> {
  return { $or: communities.map((c) => ({ community: c })) };
}

async function addUserIdsFromEmails(
  emails: Iterable<string>,
  roles: StaffRole[],
  idSet: Set<string>,
): Promise<void> {
  const roleSet = new Set<StaffRole>(roles);
  const unique = [...new Set([...emails].map((e) => e.trim()).filter(Boolean))];
  if (unique.length === 0) return;

  const users = await User.find({
    ...activeUserFilter(),
    $or: unique.map((email) => ({
      email: { $regex: new RegExp(`^${escapeRegExp(email)}$`, "i") },
    })),
  })
    .select("_id role")
    .lean();

  for (const user of users) {
    if (roleSet.has(user.role as StaffRole)) {
      idSet.add(String(user._id));
    }
  }
}

/**
 * Resolve active staff user records for program audiences and pickers.
 * SectionStaff and CommunityStaff are primary; User.community supplements.
 */
export async function resolveStaffUsers(
  options: ResolveOptions,
): Promise<ResolvedStaffUser[]> {
  const roles = options.roles?.length ? options.roles : [...STAFF_ROLES];
  const roleSet = new Set<StaffRole>(roles);
  const communities = options.communities;

  if (communities.length === 0) {
    const users = await User.find({
      ...activeUserFilter(),
      role: { $in: roles },
    })
      .select("fullName email role community")
      .sort({ fullName: 1 })
      .lean();

    return users.map(mapUser);
  }

  const idSet = new Set<string>();
  const emailSet = new Set<string>();
  const communityQuery = stringCommunityFilter(communities);

  if (roleSet.has("RA") || roleSet.has("GA")) {
    const sectionStaff = await SectionStaff.find(communityQuery).lean<
      SectionStaffLean[]
    >();

    for (const record of sectionStaff) {
      if (roleSet.has("RA") && record.raEmail?.trim()) {
        emailSet.add(record.raEmail.trim());
      }
      if (roleSet.has("GA") && record.gaEmail?.trim()) {
        emailSet.add(record.gaEmail.trim());
      }
    }
  }

  const communityStaffRoles: ("GA" | "SA")[] = [];
  if (roleSet.has("GA")) communityStaffRoles.push("GA");
  if (roleSet.has("SA")) communityStaffRoles.push("SA");

  if (communityStaffRoles.length > 0) {
    const communityStaff = await CommunityStaff.find({
      ...communityQuery,
      ...activeCommunityStaffFilter(),
      role: { $in: communityStaffRoles },
    }).lean();

    for (const record of communityStaff) {
      if (record.userId) idSet.add(String(record.userId));
      if (record.email?.trim()) emailSet.add(record.email.trim());
    }
  }

  await addUserIdsFromEmails(emailSet, roles, idSet);

  const fallbackUsers = await User.find({
    ...activeUserFilter(),
    role: { $in: roles },
    ...userCommunityFilter(communities),
  })
    .select("_id")
    .lean();

  for (const user of fallbackUsers) {
    idSet.add(String(user._id));
  }

  if (idSet.size === 0) return [];

  const users = await User.find({
    _id: { $in: [...idSet] },
    ...activeUserFilter(),
    role: { $in: roles },
  })
    .select("fullName email role community")
    .sort({ fullName: 1 })
    .lean();

  return users.map(mapUser);
}

export async function resolveStaffUserIds(
  options: ResolveOptions,
): Promise<string[]> {
  const users = await resolveStaffUsers(options);
  return users.map((u) => u.id);
}
