import type { HydratedDocument } from "mongoose";
import type { IUser } from "../../../db/user.model.js";
import {
  resolveStaffUsers,
  type StaffRole,
} from "./community-staff-resolver.service.js";

export type AudienceCandidate = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  communities: string[];
};

const PICKER_ROLES: StaffRole[] = ["RA", "GA", "SA", "Admin"];

export async function listAudienceCandidates(
  user: HydratedDocument<IUser>,
  options: { community?: string; q?: string; limit?: number },
): Promise<AudienceCandidate[]> {
  const limit = Math.min(Math.max(options.limit ?? 300, 1), 500);
  const q = options.q?.trim().toLowerCase();
  const communityParam = options.community?.trim();

  const communities = communityParam ? [communityParam] : [];

  let candidates = await resolveStaffUsers({
    communities,
    roles: PICKER_ROLES,
  });

  const selfId = String(user._id);
  candidates = candidates.filter((c) => c.id !== selfId);

  if (q) {
    candidates = candidates.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q),
    );
  }

  return candidates.slice(0, limit).map((c) => ({
    id: c.id,
    fullName: c.fullName,
    email: c.email,
    role: c.role,
    communities: c.communities,
  }));
}
