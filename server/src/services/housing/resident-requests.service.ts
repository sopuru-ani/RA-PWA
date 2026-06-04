import { randomUUID } from "crypto";
import type { HydratedDocument } from "mongoose";
import type { IUser } from "../../../db/user.model.js";
import type {
  ResidentRequestPayload,
  ResidentRequestSubmitterRole,
} from "../../../db/residentAdditionRequest.model.js";
import {
  Community,
  Resident,
  ResidentAdditionRequest,
  SectionStaff,
} from "../../lib/models.js";
import {
  assertSectionInCommunity,
  scopeError,
} from "../../lib/community-scope.js";

const BULK_MAX = 500;

function normalizePayload(row: ResidentRequestPayload): ResidentRequestPayload {
  const firstName = row.firstName?.trim() ?? "";
  const lastName = row.lastName?.trim() ?? "";
  return {
    ...row,
    firstName,
    lastName,
    fullName:
      row.fullName?.trim() ||
      `${firstName} ${lastName}`.trim(),
    email: row.email?.trim() ?? "",
    studentId: row.studentId?.trim() ?? "",
    community: row.community?.trim() ?? "",
    section: row.section?.trim() ?? "",
    room: row.room?.trim() ?? "",
    notes: row.notes?.trim(),
  };
}

function validateRequired(row: ResidentRequestPayload): string | null {
  if (!row.firstName) return "First name is required";
  if (!row.lastName) return "Last name is required";
  if (!row.email) return "Email is required";
  if (!row.studentId) return "Student ID is required";
  if (!row.community) return "Community is required";
  if (!row.section) return "Section is required";
  if (!row.room) return "Room is required";
  return null;
}

export async function findDuplicateFlags(
  email: string,
  studentId: string,
  options?: { excludeRequestId?: string },
): Promise<{ email: boolean; studentId: boolean }> {
  const excludeId = options?.excludeRequestId;
  const pendingFilter = excludeId
    ? { _id: { $ne: excludeId }, status: "pending" as const }
    : { status: "pending" as const };

  const [residentEmail, residentId, pendingEmail, pendingId] = await Promise.all([
    Resident.findOne({ email }).lean(),
    Resident.findOne({ studentId }).lean(),
    ResidentAdditionRequest.findOne({ email, ...pendingFilter }).lean(),
    ResidentAdditionRequest.findOne({ studentId, ...pendingFilter }).lean(),
  ]);

  return {
    email: !!(residentEmail || pendingEmail),
    studentId: !!(residentId || pendingId),
  };
}

export async function createResidentRequest(
  submitter: HydratedDocument<IUser>,
  payload: ResidentRequestPayload,
  options?: { batchId?: string; batchRowIndex?: number },
): Promise<{ requestId: string; duplicateWarning?: string }> {
  const community = payload.community;
  const row = normalizePayload(payload);
  const requiredErr = validateRequired(row);
  if (requiredErr) {
    throw scopeError(requiredErr, 400);
  }

  const communityDoc = await Community.findOne({ community }).lean();
  if (!communityDoc) {
    throw scopeError("Community does not exist", 400);
  }
  assertSectionInCommunity(
    communityDoc as { section?: string[] },
    row.section,
  );

  const dupes = await findDuplicateFlags(row.email, row.studentId);
  if (dupes.email || dupes.studentId) {
    throw scopeError(
      "A resident or pending request already exists with this email or student ID",
      409,
    );
  }

  const role = submitter.role as ResidentRequestSubmitterRole;
  if (role !== "GA") {
    throw scopeError("Only Area Directors can submit resident requests", 403);
  }

  const doc = await ResidentAdditionRequest.create({
    status: "pending",
    community: row.community,
    section: row.section,
    room: row.room,
    fullName: row.fullName,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    studentId: row.studentId,
    notes: row.notes,
    submittedBy: submitter._id,
    submittedByRole: role,
    submittedByEmail: submitter.email,
    batchId: options?.batchId,
    batchRowIndex: options?.batchRowIndex,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { requestId: String(doc._id) };
}

export async function createBulkResidentRequests(
  submitter: HydratedDocument<IUser>,
  rows: ResidentRequestPayload[],
  lockedCommunity: string,
): Promise<{
  batchId: string;
  created: number;
  failed: { index: number; message: string }[];
}> {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw scopeError("Expected a non-empty array", 400);
  }
  if (rows.length > BULK_MAX) {
    throw scopeError(`Maximum ${BULK_MAX} rows per upload`, 400);
  }

  const batchId = randomUUID();
  const failed: { index: number; message: string }[] = [];
  let created = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = { ...rows[i], community: lockedCommunity };
    try {
      await createResidentRequest(submitter, row, {
        batchId,
        batchRowIndex: i,
      });
      created++;
    } catch (err) {
      failed.push({
        index: i,
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return { batchId, created, failed };
}

export async function listResidentRequests(options: {
  status?: string;
  community?: string;
  submittedBy?: string;
  limit: number;
  cursor?: string;
}) {
  const limit = Math.min(Math.max(options.limit, 1), 100);
  const filter: Record<string, unknown> = {};
  if (options.status) filter.status = options.status;
  if (options.community) filter.community = options.community;
  if (options.submittedBy) filter.submittedBy = options.submittedBy;
  if (options.cursor) filter._id = { $gt: options.cursor };

  const items = await ResidentAdditionRequest.find(filter)
    .sort({ _id: 1 })
    .limit(limit + 1)
    .lean();

  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? String(page[page.length - 1]?._id) : null;

  return { items: page, nextCursor };
}

export async function promoteRequestToResident(
  requestId: string,
  reviewerId: string,
): Promise<void> {
  const request = await ResidentAdditionRequest.findById(requestId);
  if (!request) {
    throw scopeError("Request not found", 404);
  }
  if (request.status !== "pending") {
    throw scopeError("Request is not pending", 400);
  }

  const dupes = await findDuplicateFlags(request.email, request.studentId, {
    excludeRequestId: requestId,
  });
  if (dupes.email || dupes.studentId) {
    throw scopeError(
      "Cannot approve: duplicate email or student ID in residents or pending queue",
      409,
    );
  }

  const staff = await SectionStaff.findOne({
    community: request.community,
    section: request.section,
  }).lean();

  if (!staff) {
    throw scopeError(
      "No section staff record for this community/section. Add SectionStaff first.",
      422,
    );
  }

  await Resident.create({
    fullName: request.fullName,
    firstName: request.firstName,
    lastName: request.lastName,
    email: request.email,
    studentId: request.studentId,
    community: request.community,
    section: request.section,
    room: request.room,
    notes: request.notes,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Parameters<typeof Resident.create>[0]);

  request.status = "approved";
  request.reviewedBy = reviewerId as unknown as typeof request.reviewedBy;
  request.reviewedAt = new Date();
  request.updatedAt = new Date();
  await request.save();
}

export async function rejectResidentRequest(
  requestId: string,
  reviewerId: string,
  reason?: string,
): Promise<void> {
  const request = await ResidentAdditionRequest.findById(requestId);
  if (!request) {
    throw scopeError("Request not found", 404);
  }
  if (request.status !== "pending") {
    throw scopeError("Request is not pending", 400);
  }

  request.status = "rejected";
  request.reviewedBy = reviewerId as unknown as typeof request.reviewedBy;
  request.reviewedAt = new Date();
  request.rejectionReason = reason?.trim();
  request.updatedAt = new Date();
  await request.save();
}
