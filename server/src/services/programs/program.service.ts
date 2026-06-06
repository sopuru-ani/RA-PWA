import mongoose, { type HydratedDocument } from "mongoose";
import type { IUser } from "../../../db/user.model.js";
import type {
  IProgram,
  ProgramCategory,
  ProgramAudienceType,
  ProgramVisibility,
} from "../../../db/program.model.js";
import type { RsvpStatus, AttendanceStatus } from "../../../db/programInvite.model.js";
import {
  Program,
  ProgramInvite,
  User,
  type ProgramLean,
  type ProgramInviteLean,
} from "../../lib/models.js";
import {
  assertCommunitiesInScope,
  resolveAudienceUserIds,
} from "./audience-resolver.service.js";
import {
  buildMonitoringFilter,
  canAccessMonitoring,
  canApproveOrReject,
  canCancelProgram,
  canEditProgram,
  canMarkAttendance,
  canPublishAsAdmin,
  canSubmitForApproval,
  canViewProgramDetail,
  creatorRoleFromUser,
  isAdmin,
} from "../../lib/program-permissions.js";
import { scopeError } from "../../lib/community-scope.js";

export type CreateProgramInput = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string;
  timezone?: string;
  category?: ProgramCategory;
  requiredAttendance?: boolean;
  visibility?: ProgramVisibility;
  communities?: string[];
  sections?: string[];
  audience: {
    type: ProgramAudienceType;
    userIds?: string[];
    roles?: ("RA" | "GA" | "SA")[];
  };
};

export type CalendarEventDto = {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  meta: {
    requiredAttendance: boolean;
    rsvpStatus?: RsvpStatus;
    location?: string;
    category: string;
    status: string;
  };
};

function parseDate(value: string, field: string): Date {
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    throw scopeError(`${field} is invalid`, 400);
  }
  return d;
}

function validateDateRange(start: Date, end: Date): void {
  if (end < start) {
    throw scopeError("endDate must be after startDate", 400);
  }
}

function toLocalDateParts(date: Date, timezone: string): {
  date: string;
  time?: string;
} {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const dateStr = `${get("year")}-${get("month")}-${get("day")}`;
  const hour = get("hour");
  const minute = get("minute");
  const time =
    hour && minute ? `${hour === "24" ? "00" : hour}:${minute}` : undefined;

  return { date: dateStr, time };
}

async function generateInvites(programId: string): Promise<number> {
  const program = await Program.findById(programId);
  if (!program) {
    throw scopeError("Program not found", 404);
  }

  const userIds = await resolveAudienceUserIds(program);
  const creatorId = String(program.createdBy);
  const uniqueIds = [...new Set(userIds.filter((id) => id !== creatorId))];

  if (uniqueIds.length === 0) {
    return 0;
  }

  const programObjectId = new mongoose.Types.ObjectId(programId);
  const ops = uniqueIds.map((userId) => ({
    updateOne: {
      filter: {
        programId: programObjectId,
        userId: new mongoose.Types.ObjectId(userId),
      },
      update: {
        $setOnInsert: {
          programId: programObjectId,
          userId: new mongoose.Types.ObjectId(userId),
          rsvpStatus: "pending" as const,
          attendanceStatus: "unmarked" as const,
          syncedToCalendar: false,
          reminderSent: false,
          createdAt: new Date(),
        },
        $set: { updatedAt: new Date() },
      },
      upsert: true,
    },
  }));

  const BATCH_SIZE = 500;
  for (let i = 0; i < ops.length; i += BATCH_SIZE) {
    await ProgramInvite.bulkWrite(ops.slice(i, i + BATCH_SIZE), {
      ordered: false,
    });
  }

  return uniqueIds.length;
}

export async function createProgram(
  user: HydratedDocument<IUser>,
  input: CreateProgramInput,
): Promise<ProgramLean> {
  const startDate = parseDate(input.startDate, "startDate");
  const endDate = parseDate(input.endDate, "endDate");
  validateDateRange(startDate, endDate);

  const communities = input.communities ?? [];
  assertCommunitiesInScope(user, communities);

  const program = await Program.create({
    title: input.title.trim(),
    description: input.description,
    startDate,
    endDate,
    location: input.location?.trim(),
    timezone: input.timezone ?? "America/Chicago",
    category: input.category ?? "other",
    status: "draft",
    requiredAttendance: input.requiredAttendance ?? false,
    visibility: input.visibility ?? "invite_only",
    communities,
    sections: input.sections ?? [],
    audience: {
      type: input.audience.type,
      userIds: (input.audience.userIds ?? []).map(
        (id) => new mongoose.Types.ObjectId(id),
      ),
      roles: input.audience.roles ?? [],
    },
    createdBy: user._id,
    createdByRole: creatorRoleFromUser(user.role),
    attachments: [],
    microsoft: { syncStatus: "none" },
  });

  return program.toObject() as unknown as ProgramLean;
}

export async function updateProgram(
  user: HydratedDocument<IUser>,
  programId: string,
  input: Partial<CreateProgramInput>,
): Promise<ProgramLean> {
  const program = await Program.findById(programId);
  if (!program) {
    throw scopeError("Program not found", 404);
  }

  canEditProgram(user, program);

  if (input.title !== undefined) program.title = input.title.trim();
  if (input.description !== undefined) program.description = input.description;
  if (input.location !== undefined) program.location = input.location?.trim();
  if (input.timezone !== undefined) program.timezone = input.timezone;
  if (input.category !== undefined) program.category = input.category;
  if (input.requiredAttendance !== undefined) {
    program.requiredAttendance = input.requiredAttendance;
  }
  if (input.visibility !== undefined) program.visibility = input.visibility;

  if (input.communities !== undefined) {
    assertCommunitiesInScope(user, input.communities);
    program.communities = input.communities;
  }
  if (input.sections !== undefined) program.sections = input.sections;

  if (input.audience !== undefined) {
    program.audience = {
      type: input.audience.type,
      userIds: (input.audience.userIds ?? []).map(
        (id) => new mongoose.Types.ObjectId(id),
      ),
      roles: input.audience.roles ?? [],
    };
  }

  if (input.startDate !== undefined) {
    program.startDate = parseDate(input.startDate, "startDate");
  }
  if (input.endDate !== undefined) {
    program.endDate = parseDate(input.endDate, "endDate");
  }
  validateDateRange(program.startDate, program.endDate);

  if (program.status === "rejected") {
    program.status = "draft";
    program.rejectionReason = undefined;
    program.reviewedBy = undefined;
    program.reviewedAt = undefined;
  }

  program.updatedAt = new Date();
  await program.save();
  return program.toObject() as unknown as ProgramLean;
}

export async function submitProgramForApproval(
  user: HydratedDocument<IUser>,
  programId: string,
): Promise<ProgramLean> {
  const program = await Program.findById(programId);
  if (!program) {
    throw scopeError("Program not found", 404);
  }

  canSubmitForApproval(user, program);

  program.status = "pending_approval";
  program.submittedAt = new Date();
  program.updatedAt = new Date();
  await program.save();

  return program.toObject() as unknown as ProgramLean;
}

export async function publishProgramAsAdmin(
  user: HydratedDocument<IUser>,
  programId: string,
): Promise<{ program: ProgramLean; inviteCount: number }> {
  const program = await Program.findById(programId);
  if (!program) {
    throw scopeError("Program not found", 404);
  }

  canPublishAsAdmin(user, program);

  program.status = "published";
  program.publishedAt = new Date();
  program.updatedAt = new Date();
  await program.save();

  const inviteCount = await generateInvites(programId);
  return {
    program: program.toObject() as unknown as ProgramLean,
    inviteCount,
  };
}

export async function approveProgram(
  user: HydratedDocument<IUser>,
  programId: string,
): Promise<{ program: ProgramLean; inviteCount: number }> {
  const program = await Program.findById(programId);
  if (!program) {
    throw scopeError("Program not found", 404);
  }

  canApproveOrReject(user, program);

  program.status = "published";
  program.reviewedBy = user._id;
  program.reviewedAt = new Date();
  program.publishedAt = new Date();
  program.rejectionReason = undefined;
  program.updatedAt = new Date();
  await program.save();

  const inviteCount = await generateInvites(programId);
  return {
    program: program.toObject() as unknown as ProgramLean,
    inviteCount,
  };
}

export async function rejectProgram(
  user: HydratedDocument<IUser>,
  programId: string,
  rejectionReason?: string,
): Promise<ProgramLean> {
  const program = await Program.findById(programId);
  if (!program) {
    throw scopeError("Program not found", 404);
  }

  canApproveOrReject(user, program);

  program.status = "rejected";
  program.reviewedBy = user._id;
  program.reviewedAt = new Date();
  program.rejectionReason = rejectionReason?.trim() || "No reason provided";
  program.updatedAt = new Date();
  await program.save();

  return program.toObject() as unknown as ProgramLean;
}

export async function cancelProgram(
  user: HydratedDocument<IUser>,
  programId: string,
): Promise<ProgramLean> {
  const program = await Program.findById(programId);
  if (!program) {
    throw scopeError("Program not found", 404);
  }

  canCancelProgram(user, program);

  program.status = "cancelled";
  program.updatedAt = new Date();
  await program.save();

  return program.toObject() as unknown as ProgramLean;
}

export async function listParticipationPrograms(
  user: HydratedDocument<IUser>,
  options: { from?: string; to?: string },
): Promise<ProgramLean[]> {
  const userId = String(user._id);

  const inviteProgramIds = await ProgramInvite.find({ userId })
    .select("programId")
    .lean();
  const invitedIds = inviteProgramIds.map((i) => i.programId);

  const ownPrograms = await Program.find({ createdBy: user._id }).lean();

  const filter: Record<string, unknown> = {
    $or: [
      { _id: { $in: invitedIds }, status: "published" },
      { createdBy: user._id },
    ],
  };

  if (options.from || options.to) {
    const dateFilter: Record<string, Date> = {};
    if (options.from) dateFilter.$gte = parseDate(options.from, "from");
    if (options.to) dateFilter.$lte = parseDate(options.to, "to");
    filter.startDate = dateFilter;
  }

  const programs = await Program.find(filter)
    .sort({ startDate: 1 })
    .lean<ProgramLean[]>();

  const ownIds = new Set(ownPrograms.map((p) => String(p._id)));
  return programs.filter(
    (p) =>
      ownIds.has(String(p._id)) ||
      p.status === "published",
  );
}

export async function listMonitoringPrograms(
  user: HydratedDocument<IUser>,
): Promise<ProgramLean[]> {
  const filter = buildMonitoringFilter(user);
  return Program.find(filter).sort({ startDate: -1 }).lean<ProgramLean[]>();
}

export async function listPendingApprovalPrograms(): Promise<ProgramLean[]> {
  return Program.find({ status: "pending_approval" })
    .sort({ submittedAt: -1 })
    .lean<ProgramLean[]>();
}

const CALENDAR_MAX_RANGE_MS = 90 * 24 * 60 * 60 * 1000;

export async function getCalendarEvents(
  user: HydratedDocument<IUser>,
  from: string,
  to: string,
): Promise<CalendarEventDto[]> {
  const fromDate = parseDate(from, "from");
  const toDate = parseDate(to, "to");

  if (toDate.getTime() - fromDate.getTime() > CALENDAR_MAX_RANGE_MS) {
    throw scopeError("Calendar date range cannot exceed 90 days", 400);
  }

  const programs = await listParticipationPrograms(user, { from, to });
  const published = programs.filter((p) => p.status === "published");
  const programIds = published.map((p) => p._id);

  const invites = await ProgramInvite.find({
    userId: user._id,
    programId: { $in: programIds },
  }).lean<ProgramInviteLean[]>();

  const inviteMap = new Map(
    invites.map((i) => [String(i.programId), i.rsvpStatus]),
  );

  return published
    .filter((p) => p.startDate >= fromDate && p.startDate <= toDate)
    .map((p) => {
      const start = toLocalDateParts(new Date(p.startDate), p.timezone);
      const end = toLocalDateParts(new Date(p.endDate), p.timezone);
      return {
        id: String(p._id),
        title: p.title,
        date: start.date,
        startTime: start.time,
        endTime: end.time,
        meta: {
          requiredAttendance: p.requiredAttendance,
          rsvpStatus: inviteMap.get(String(p._id)),
          location: p.location,
          category: p.category,
          status: p.status,
        },
      };
    });
}

export async function getProgramDetail(
  user: HydratedDocument<IUser>,
  programId: string,
): Promise<{
  program: ProgramLean;
  invite?: ProgramInviteLean;
}> {
  const program = await Program.findById(programId).lean<ProgramLean | null>();
  if (!program) {
    throw scopeError("Program not found", 404);
  }

  const invite = await ProgramInvite.findOne({
    programId,
    userId: user._id,
  }).lean<ProgramInviteLean | null>();

  canViewProgramDetail(user, program, Boolean(invite));

  return { program, invite: invite ?? undefined };
}

export async function updateRsvp(
  user: HydratedDocument<IUser>,
  programId: string,
  rsvpStatus: RsvpStatus,
): Promise<ProgramInviteLean> {
  const program = await Program.findById(programId);
  if (!program || program.status !== "published") {
    throw scopeError("Program not available for RSVP", 404);
  }

  const invite = await ProgramInvite.findOne({
    programId,
    userId: user._id,
  });

  if (!invite) {
    throw scopeError("You are not invited to this program", 403);
  }

  invite.rsvpStatus = rsvpStatus;
  invite.updatedAt = new Date();
  await invite.save();

  return invite.toObject() as unknown as ProgramInviteLean;
}

export async function updateAttendance(
  user: HydratedDocument<IUser>,
  programId: string,
  updates: { userId: string; attendanceStatus: AttendanceStatus }[],
): Promise<ProgramInviteLean[]> {
  const program = await Program.findById(programId);
  if (!program) {
    throw scopeError("Program not found", 404);
  }

  canMarkAttendance(user, program);

  const results: ProgramInviteLean[] = [];

  for (const update of updates) {
    const invite = await ProgramInvite.findOne({
      programId,
      userId: update.userId,
    });
    if (!invite) continue;

    invite.attendanceStatus = update.attendanceStatus;
    if (update.attendanceStatus === "attended") {
      invite.checkedInAt = new Date();
      invite.checkedInBy = user._id;
    }
    invite.updatedAt = new Date();
    await invite.save();
    results.push(invite.toObject() as unknown as ProgramInviteLean);
  }

  return results;
}

export type AttendanceRow = ProgramInviteLean & {
  user?: { fullName: string; email: string; role: string };
};

export async function listProgramAttendance(
  user: HydratedDocument<IUser>,
  programId: string,
): Promise<AttendanceRow[]> {
  const program = await Program.findById(programId).lean<ProgramLean | null>();
  if (!program) {
    throw scopeError("Program not found", 404);
  }

  if (!canAccessMonitoring(user, program)) {
    throw scopeError("You cannot view attendance for this program", 403);
  }

  const invites = await ProgramInvite.find({ programId }).lean<ProgramInviteLean[]>();
  const userIds = invites.map((i) => i.userId);
  const users = await User.find({ _id: { $in: userIds } })
    .select("fullName email role")
    .lean();

  const userMap = new Map(users.map((u) => [String(u._id), u]));

  return invites.map((invite) => {
    const row = invite as unknown as AttendanceRow;
    const matched = userMap.get(String(invite.userId));
    if (matched) {
      row.user = {
        fullName: matched.fullName,
        email: matched.email,
        role: matched.role,
      };
    }
    return row;
  });
}

export async function getProgramStats(
  user: HydratedDocument<IUser>,
): Promise<{
  upcomingCount: number;
  pendingRsvpCount: number;
  requiredCount: number;
  pendingApprovalCount?: number;
}> {
  const now = new Date();
  const userId = String(user._id);

  const [invites, requiredInvites, upcomingOwn] = await Promise.all([
    ProgramInvite.find({ userId, rsvpStatus: "pending" })
      .populate<{ programId: { status: string; startDate: Date } }>({
        path: "programId",
        select: "status startDate requiredAttendance",
      })
      .lean(),
    ProgramInvite.find({ userId, rsvpStatus: { $ne: "declined" } })
      .populate<{ programId: { status: string; startDate: Date; requiredAttendance: boolean } }>({
        path: "programId",
        select: "status startDate requiredAttendance",
      })
      .lean(),
    Program.find({
      createdBy: user._id,
      status: { $in: ["draft", "pending_approval", "rejected"] },
    }).countDocuments(),
  ]);

  const pendingRsvpCount = invites.filter(
    (i) =>
      i.programId &&
      typeof i.programId === "object" &&
      "status" in i.programId &&
      i.programId.status === "published" &&
      new Date(i.programId.startDate) > now,
  ).length;

  const upcomingCount = invites.filter(
    (i) =>
      i.programId &&
      typeof i.programId === "object" &&
      "status" in i.programId &&
      i.programId.status === "published" &&
      new Date(i.programId.startDate) > now,
  ).length;

  const requiredCount = requiredInvites.filter(
    (i) =>
      i.programId &&
      typeof i.programId === "object" &&
      "requiredAttendance" in i.programId &&
      i.programId.requiredAttendance &&
      i.programId.status === "published" &&
      new Date(i.programId.startDate) > now,
  ).length;

  const stats = {
    upcomingCount,
    pendingRsvpCount,
    requiredCount,
    draftOrPendingOwnCount: upcomingOwn,
  };

  if (isAdmin(user)) {
    const pendingApprovalCount = await Program.countDocuments({
      status: "pending_approval",
    });
    return { ...stats, pendingApprovalCount };
  }

  return stats;
}

export type ProgramAttachmentInput = {
  filename: string;
  mimeType?: string;
  size?: number;
  bucket: string;
};

export async function addProgramAttachment(
  user: HydratedDocument<IUser>,
  programId: string,
  input: ProgramAttachmentInput,
): Promise<ProgramLean> {
  const program = await Program.findById(programId);
  if (!program) {
    throw scopeError("Program not found", 404);
  }

  canEditProgram(user, program);

  if (!input.filename?.trim() || !input.bucket?.trim()) {
    throw scopeError("filename and bucket (URL or key) are required", 400);
  }

  program.attachments.push({
    id: new mongoose.Types.ObjectId().toString(),
    filename: input.filename.trim(),
    mimeType: input.mimeType?.trim() || "application/octet-stream",
    size: input.size ?? 0,
    bucket: input.bucket.trim(),
    uploadedAt: new Date(),
  } as never);
  program.updatedAt = new Date();
  await program.save();

  return program.toObject() as unknown as ProgramLean;
}

export async function removeProgramAttachment(
  user: HydratedDocument<IUser>,
  programId: string,
  attachmentId: string,
): Promise<ProgramLean> {
  const program = await Program.findById(programId);
  if (!program) {
    throw scopeError("Program not found", 404);
  }

  canEditProgram(user, program);

  const before = program.attachments.length;
  program.attachments = program.attachments.filter(
    (a) => a.id !== attachmentId,
  ) as never;

  if (program.attachments.length === before) {
    throw scopeError("Attachment not found", 404);
  }

  program.updatedAt = new Date();
  await program.save();

  return program.toObject() as unknown as ProgramLean;
}
