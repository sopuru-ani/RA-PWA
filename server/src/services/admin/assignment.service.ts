import type { HydratedDocument } from "mongoose";
import type { IUser } from "../../../db/user.model.js";
import type { IAuthorized } from "../../../db/authorizedAccounts.model.js";
import { SectionStaff, CommunityStaff } from "../../lib/models.js";
import {
  syncSectionStaffForRa,
  syncCommunityStaff,
} from "./staff.service.js";

type StaffLike = Pick<IUser, "email" | "role" | "community" | "assignment"> | Pick<
  IAuthorized,
  "email" | "role" | "community" | "assignment"
>;

export async function applyStaffAssignments(
  staff: StaffLike,
  options?: { gaEmail?: string; userId?: string; isActive?: boolean },
): Promise<void> {
  const isActive = options?.isActive !== false;
  const community = staff.community ?? [];
  const assignment = staff.assignment ?? [];

  if (staff.role === "RA" && community[0] && assignment[0]) {
    await syncSectionStaffForRa(
      community[0],
      assignment[0],
      staff.email,
      options?.gaEmail,
    );
  }

  if (
    (staff.role === "GA" || staff.role === "SA") &&
    options?.userId &&
    community.length > 0
  ) {
    for (const c of community) {
      await syncCommunityStaff(
        c,
        options.userId,
        staff.role,
        staff.email,
        isActive,
      );
    }
  }
}

export async function clearStaffAssignments(
  email: string,
  role: IUser["role"],
  userId?: string,
): Promise<void> {
  if (role === "RA") {
    await SectionStaff.deleteMany({ raEmail: email.trim() });
  }

  if ((role === "GA" || role === "SA") && userId) {
    await CommunityStaff.updateMany(
      { userId },
      { $set: { isActive: false, updatedAt: new Date() } },
    );
  }
}

export async function deactivateUserAccount(
  user: HydratedDocument<IUser>,
): Promise<void> {
  await clearStaffAssignments(user.email, user.role, String(user._id));

  user.isActive = false;
  user.updatedAt = new Date();
  await user.save();
}

export async function reactivateUserAccount(
  user: HydratedDocument<IUser>,
): Promise<void> {
  user.isActive = true;
  user.updatedAt = new Date();
  await user.save();

  await applyStaffAssignments(user, {
    userId: String(user._id),
    isActive: true,
  });
}
