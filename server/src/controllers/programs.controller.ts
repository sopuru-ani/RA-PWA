import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { connectDB } from "../lib/connect.js";
import { isAdmin } from "../lib/program-permissions.js";
import * as programService from "../services/programs/program.service.js";
import type { RsvpStatus, AttendanceStatus } from "../../db/programInvite.model.js";
import { getProgramConflicts } from "../services/programs/program-conflicts.service.js";
import { exportAttendanceCsv } from "../services/programs/program-export.service.js";
import { sendDueProgramReminders } from "../services/programs/program-reminder.service.js";
import { Program } from "../lib/models.js";

function parseCreateInput(
  body: Record<string, unknown>,
  partial = false,
): programService.CreateProgramInput {
  const audience = body.audience as Record<string, unknown> | undefined;
  if (!partial && !audience?.type) {
    const err = new Error("audience.type is required") as Error & {
      statusCode: number;
    };
    err.statusCode = 400;
    throw err;
  }

  const input: programService.CreateProgramInput = {
    title: String(body.title ?? ""),
    description: String(body.description ?? ""),
    startDate: String(body.startDate ?? ""),
    endDate: String(body.endDate ?? ""),
    audience: {
      type: (audience?.type ??
        "all_staff") as programService.CreateProgramInput["audience"]["type"],
      userIds: Array.isArray(audience?.userIds)
        ? audience.userIds.map(String)
        : undefined,
      roles: Array.isArray(audience?.roles)
        ? (audience.roles as ("RA" | "GA" | "SA")[])
        : undefined,
    },
  };

  if (body.location !== undefined) {
    input.location = body.location ? String(body.location) : undefined;
  }
  if (body.timezone !== undefined) {
    input.timezone = String(body.timezone);
  }
  if (body.category !== undefined) {
    input.category = body.category as programService.CreateProgramInput["category"];
  }
  if (body.requiredAttendance !== undefined) {
    input.requiredAttendance =
      body.requiredAttendance === true || body.requiredAttendance === "true";
  }
  if (body.visibility !== undefined) {
    input.visibility =
      body.visibility as programService.CreateProgramInput["visibility"];
  }
  if (Array.isArray(body.communities)) {
    input.communities = body.communities.map(String);
  }
  if (Array.isArray(body.sections)) {
    input.sections = body.sections.map(String);
  }

  return input;
}

function parseUpdateInput(
  body: Record<string, unknown>,
): Partial<programService.CreateProgramInput> {
  const input: Partial<programService.CreateProgramInput> = {};

  if (body.title !== undefined) input.title = String(body.title);
  if (body.description !== undefined) input.description = String(body.description);
  if (body.startDate !== undefined) input.startDate = String(body.startDate);
  if (body.endDate !== undefined) input.endDate = String(body.endDate);
  if (body.location !== undefined) {
    input.location = body.location ? String(body.location) : undefined;
  }
  if (body.timezone !== undefined) input.timezone = String(body.timezone);
  if (body.category !== undefined) {
    input.category = body.category as programService.CreateProgramInput["category"];
  }
  if (body.requiredAttendance !== undefined) {
    input.requiredAttendance =
      body.requiredAttendance === true || body.requiredAttendance === "true";
  }
  if (body.visibility !== undefined) {
    input.visibility =
      body.visibility as programService.CreateProgramInput["visibility"];
  }
  if (Array.isArray(body.communities)) {
    input.communities = body.communities.map(String);
  }
  if (Array.isArray(body.sections)) {
    input.sections = body.sections.map(String);
  }

  const audience = body.audience as Record<string, unknown> | undefined;
  if (audience?.type) {
    input.audience = {
      type: audience.type as programService.CreateProgramInput["audience"]["type"],
      userIds: Array.isArray(audience.userIds)
        ? audience.userIds.map(String)
        : undefined,
      roles: Array.isArray(audience.roles)
        ? (audience.roles as ("RA" | "GA" | "SA")[])
        : undefined,
    };
  }

  return input;
}

export async function createProgram(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const dbUser = req.dbUser;
  if (!dbUser) {
    res.status(401).json({ msg: "Unauthorized" });
    return;
  }

  const input = parseCreateInput(req.body as Record<string, unknown>);
  if (!input.title.trim() || !input.startDate || !input.endDate) {
    res.status(400).json({ msg: "title, startDate, and endDate are required" });
    return;
  }

  const program = await programService.createProgram(dbUser, input);
  res.status(201).json({ msg: "Program created", program });
}

export async function updateProgram(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const dbUser = req.dbUser;
  if (!dbUser) {
    res.status(401).json({ msg: "Unauthorized" });
    return;
  }

  const input = parseUpdateInput(req.body as Record<string, unknown>);
  const program = await programService.updateProgram(
    dbUser,
    req.params.id as string,
    input,
  );
  res.json({ msg: "Program updated", program });
}

export async function listPrograms(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const dbUser = req.dbUser;
  if (!dbUser) {
    res.status(401).json({ msg: "Unauthorized" });
    return;
  }

  const programs = await programService.listParticipationPrograms(dbUser, {
    from: req.query.from as string | undefined,
    to: req.query.to as string | undefined,
  });
  res.json({ msg: "OK", programs });
}

export async function listMonitoringPrograms(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const dbUser = req.dbUser;
  if (!dbUser) {
    res.status(401).json({ msg: "Unauthorized" });
    return;
  }

  if (dbUser.role !== "Admin" && dbUser.role !== "GA") {
    res.status(403).json({ msg: "Forbidden" });
    return;
  }

  const programs = await programService.listMonitoringPrograms(dbUser);
  res.json({ msg: "OK", programs });
}

export async function listPendingApproval(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const dbUser = req.dbUser;
  if (!dbUser) {
    res.status(401).json({ msg: "Unauthorized" });
    return;
  }

  if (!isAdmin(dbUser)) {
    res.status(403).json({ msg: "Forbidden" });
    return;
  }

  const programs = await programService.listPendingApprovalPrograms();
  res.json({ msg: "OK", programs });
}

export async function getCalendar(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const dbUser = req.dbUser;
  if (!dbUser) {
    res.status(401).json({ msg: "Unauthorized" });
    return;
  }

  const from = req.query.from as string;
  const to = req.query.to as string;
  if (!from || !to) {
    res.status(400).json({ msg: "from and to query params are required" });
    return;
  }

  const events = await programService.getCalendarEvents(dbUser, from, to);
  res.json({ msg: "OK", events });
}

export async function getProgram(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const dbUser = req.dbUser;
  if (!dbUser) {
    res.status(401).json({ msg: "Unauthorized" });
    return;
  }

  const result = await programService.getProgramDetail(
    dbUser,
    req.params.id as string,
  );
  res.json({ msg: "OK", ...result });
}

export async function submitForApproval(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const dbUser = req.dbUser;
  if (!dbUser) {
    res.status(401).json({ msg: "Unauthorized" });
    return;
  }

  const program = await programService.submitProgramForApproval(
    dbUser,
    req.params.id as string,
  );
  res.json({ msg: "Program submitted for approval", program });
}

export async function publishProgram(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const dbUser = req.dbUser;
  if (!dbUser) {
    res.status(401).json({ msg: "Unauthorized" });
    return;
  }

  const result = await programService.publishProgramAsAdmin(
    dbUser,
    req.params.id as string,
  );
  res.json({
    msg: "Program published",
    program: result.program,
    inviteCount: result.inviteCount,
  });
}

export async function approveProgram(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const dbUser = req.dbUser;
  if (!dbUser) {
    res.status(401).json({ msg: "Unauthorized" });
    return;
  }

  const result = await programService.approveProgram(
    dbUser,
    req.params.id as string,
  );
  res.json({
    msg: "Program approved and published",
    program: result.program,
    inviteCount: result.inviteCount,
  });
}

export async function rejectProgram(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const dbUser = req.dbUser;
  if (!dbUser) {
    res.status(401).json({ msg: "Unauthorized" });
    return;
  }

  const body = req.body as { rejectionReason?: string };
  const program = await programService.rejectProgram(
    dbUser,
    req.params.id as string,
    body.rejectionReason,
  );
  res.json({ msg: "Program rejected", program });
}

export async function cancelProgram(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const dbUser = req.dbUser;
  if (!dbUser) {
    res.status(401).json({ msg: "Unauthorized" });
    return;
  }

  const program = await programService.cancelProgram(
    dbUser,
    req.params.id as string,
  );
  res.json({ msg: "Program cancelled", program });
}

export async function updateRsvp(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const dbUser = req.dbUser;
  if (!dbUser) {
    res.status(401).json({ msg: "Unauthorized" });
    return;
  }

  const body = req.body as { rsvpStatus?: RsvpStatus };
  const valid: RsvpStatus[] = ["pending", "accepted", "declined", "tentative"];
  if (!body.rsvpStatus || !valid.includes(body.rsvpStatus)) {
    res.status(400).json({ msg: "Valid rsvpStatus is required" });
    return;
  }

  const invite = await programService.updateRsvp(
    dbUser,
    req.params.id as string,
    body.rsvpStatus,
  );
  res.json({ msg: "RSVP updated", invite });
}

export async function updateAttendance(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const dbUser = req.dbUser;
  if (!dbUser) {
    res.status(401).json({ msg: "Unauthorized" });
    return;
  }

  const body = req.body as {
    updates?: { userId: string; attendanceStatus: AttendanceStatus }[];
  };
  if (!Array.isArray(body.updates) || body.updates.length === 0) {
    res.status(400).json({ msg: "updates array is required" });
    return;
  }

  const invites = await programService.updateAttendance(
    dbUser,
    req.params.id as string,
    body.updates,
  );
  res.json({ msg: "Attendance updated", invites });
}

export async function getAttendance(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const dbUser = req.dbUser;
  if (!dbUser) {
    res.status(401).json({ msg: "Unauthorized" });
    return;
  }

  const invites = await programService.listProgramAttendance(
    dbUser,
    req.params.id as string,
  );
  res.json({ msg: "OK", invites });
}

export async function getProgramStats(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const dbUser = req.dbUser;
  if (!dbUser) {
    res.status(401).json({ msg: "Unauthorized" });
    return;
  }

  const stats = await programService.getProgramStats(dbUser);
  res.json({ msg: "OK", programStats: stats });
}

export async function getConflicts(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const dbUser = req.dbUser;
  if (!dbUser) {
    res.status(401).json({ msg: "Unauthorized" });
    return;
  }

  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;
  const excludeId = req.query.excludeId as string | undefined;

  if (!startDate || !endDate) {
    res.status(400).json({ msg: "startDate and endDate are required" });
    return;
  }

  const conflicts = await getProgramConflicts(
    dbUser,
    startDate,
    endDate,
    excludeId,
  );
  res.json({ msg: "OK", conflicts });
}

export async function exportAttendance(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const dbUser = req.dbUser;
  if (!dbUser) {
    res.status(401).json({ msg: "Unauthorized" });
    return;
  }

  const programId = req.params.id as string;
  const csv = await exportAttendanceCsv(dbUser, programId);
  const programDoc = await Program.findById(programId).select("title").lean();
  const slug = (programDoc?.title ?? "program")
    .replace(/[^a-z0-9]+/gi, "-")
    .toLowerCase()
    .slice(0, 40);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="attendance-${slug || "program"}.csv"`,
  );
  res.send(csv);
}

export async function addAttachment(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const dbUser = req.dbUser;
  if (!dbUser) {
    res.status(401).json({ msg: "Unauthorized" });
    return;
  }

  const body = req.body as programService.ProgramAttachmentInput;
  const program = await programService.addProgramAttachment(
    dbUser,
    req.params.id as string,
    body,
  );
  res.json({ msg: "Attachment added", program });
}

export async function removeAttachment(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const dbUser = req.dbUser;
  if (!dbUser) {
    res.status(401).json({ msg: "Unauthorized" });
    return;
  }

  const program = await programService.removeProgramAttachment(
    dbUser,
    req.params.id as string,
    req.params.attachmentId as string,
  );
  res.json({ msg: "Attachment removed", program });
}

export async function sendReminders(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const dbUser = req.dbUser;
  if (!dbUser) {
    res.status(401).json({ msg: "Unauthorized" });
    return;
  }

  if (!isAdmin(dbUser)) {
    res.status(403).json({ msg: "Forbidden" });
    return;
  }

  const result = await sendDueProgramReminders();
  res.json({ msg: "Reminder job completed", result });
}
