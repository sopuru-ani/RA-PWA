import type { HydratedDocument } from "mongoose";
import type { IUser } from "../../db/user.model.js";
import type {
  IProgram,
  ProgramCreatorRole,
} from "../../db/program.model.js";
import { scopeError } from "./community-scope.js";

export function isAdmin(user: Pick<IUser, "role">): boolean {
  return user.role === "Admin";
}

export function canCreateProgram(_user: Pick<IUser, "role">): boolean {
  return true;
}

export function canSubmitForApproval(
  user: HydratedDocument<IUser>,
  program: Pick<IProgram, "createdBy" | "status" | "createdByRole">,
): void {
  if (String(program.createdBy) !== String(user._id)) {
    throw scopeError("Only the creator can submit this program", 403);
  }
  if (program.createdByRole === "Admin") {
    throw scopeError("Admin programs are published directly", 400);
  }
  if (program.status !== "draft" && program.status !== "rejected") {
    throw scopeError("Only draft or rejected programs can be submitted", 400);
  }
}

export function canPublishAsAdmin(
  user: HydratedDocument<IUser>,
  program: Pick<IProgram, "createdBy" | "status" | "createdByRole">,
): void {
  if (!isAdmin(user)) {
    throw scopeError("Only admins can publish directly", 403);
  }
  if (String(program.createdBy) !== String(user._id)) {
    throw scopeError("Only the creator can publish this program", 403);
  }
  if (program.createdByRole !== "Admin") {
    throw scopeError("Non-admin programs require approval before publishing", 400);
  }
  if (program.status !== "draft") {
    throw scopeError("Only draft programs can be published", 400);
  }
}

export function canApproveOrReject(
  user: Pick<IUser, "role">,
  program: Pick<IProgram, "status" | "createdByRole">,
): void {
  if (!isAdmin(user)) {
    throw scopeError("Only admins can approve or reject programs", 403);
  }
  if (program.createdByRole === "Admin") {
    throw scopeError("Admin programs do not require approval", 400);
  }
  if (program.status !== "pending_approval") {
    throw scopeError("Only pending programs can be reviewed", 400);
  }
}

export function canEditProgram(
  user: HydratedDocument<IUser>,
  program: Pick<
    IProgram,
    "createdBy" | "createdByRole" | "status" | "communities"
  >,
): void {
  const isCreator = String(program.createdBy) === String(user._id);
  const editableStatus = ["draft", "rejected", "pending_approval"].includes(
    program.status,
  );

  if (isCreator && editableStatus) {
    return;
  }

  if (isAdmin(user)) {
    return;
  }

  if (
    user.role === "GA" &&
    (program.createdByRole === "RA" || program.createdByRole === "SA") &&
    programInAdCommunities(user, program)
  ) {
    return;
  }

  throw scopeError("You cannot edit this program", 403);
}

export function canCancelProgram(
  user: HydratedDocument<IUser>,
  program: Pick<
    IProgram,
    "createdBy" | "createdByRole" | "status" | "communities"
  >,
): void {
  if (program.status === "cancelled") {
    throw scopeError("Program is already cancelled", 400);
  }

  const isCreator = String(program.createdBy) === String(user._id);
  if (isCreator) return;

  if (isAdmin(user)) return;

  if (
    user.role === "GA" &&
    (program.createdByRole === "RA" || program.createdByRole === "SA") &&
    programInAdCommunities(user, program)
  ) {
    return;
  }

  throw scopeError("You cannot cancel this program", 403);
}

export function canViewProgramDetail(
  user: HydratedDocument<IUser>,
  program: Pick<
    IProgram,
    "createdBy" | "createdByRole" | "status" | "communities"
  >,
  hasInvite: boolean,
): void {
  if (String(program.createdBy) === String(user._id)) return;
  if (hasInvite && program.status === "published") return;
  if (canAccessMonitoring(user, program)) return;
  if (isAdmin(user) && program.status === "pending_approval") return;

  throw scopeError("You cannot view this program", 403);
}

export function canAccessMonitoring(
  user: HydratedDocument<IUser>,
  program: Pick<IProgram, "createdByRole" | "communities" | "status">,
): boolean {
  if (program.status === "draft" || program.status === "rejected") {
    return false;
  }

  if (user.role === "Admin") {
    if (program.createdByRole === "Admin") return true;
    if (program.createdByRole === "GA") return true;
    if (program.createdByRole === "RA" || program.createdByRole === "SA") {
      return true;
    }
  }

  if (user.role === "GA") {
    if (program.createdByRole === "RA" || program.createdByRole === "SA") {
      return programInAdCommunities(user, program);
    }
  }

  return false;
}

export function buildMonitoringFilter(
  user: HydratedDocument<IUser>,
): Record<string, unknown> {
  const publishedStatuses = ["published", "cancelled", "pending_approval"];

  if (user.role === "Admin") {
    return { status: { $in: publishedStatuses } };
  }

  if (user.role === "GA") {
    const communities = user.community ?? [];
    return {
      createdByRole: { $in: ["RA", "SA"] },
      status: { $in: publishedStatuses },
      $or: [
        { communities: { $in: communities } },
        { communities: { $size: 0 } },
      ],
    };
  }

  return { _id: null };
}

export function canMarkAttendance(
  user: HydratedDocument<IUser>,
  program: Pick<IProgram, "createdByRole" | "communities" | "status">,
): void {
  if (program.status !== "published") {
    throw scopeError("Attendance is only available for published programs", 400);
  }

  if (!canAccessMonitoring(user, program)) {
    throw scopeError("You cannot manage attendance for this program", 403);
  }
}

function programInAdCommunities(
  user: Pick<IUser, "community">,
  program: Pick<IProgram, "communities">,
): boolean {
  const userCommunities = user.community ?? [];
  const programCommunities = program.communities ?? [];

  if (programCommunities.length === 0) {
    return true;
  }

  return programCommunities.some((c) => userCommunities.includes(c));
}

export function creatorRoleFromUser(
  role: IUser["role"],
): ProgramCreatorRole {
  return role;
}
