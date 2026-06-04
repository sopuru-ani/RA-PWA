import { randomUUID } from "crypto";
import type { HydratedDocument } from "mongoose";
import type { IUser } from "../../../db/user.model.js";
import type {
  ResidentRequestPayload,
  ResidentUpdateRequestPayload,
  ResidentChangeRequestType,
  ResidentChangeSubmitterRole,
} from "../../../db/residentChangeRequest.model.js";
import { GA_UPDATABLE_FIELDS } from "../../../db/residentChangeRequest.model.js";
import {
  Community,
  Resident,
  ResidentChangeRequest,
  SectionStaff,
  type ResidentLean,
} from "../../lib/models.js";
import {
  assertSectionInCommunity,
  scopeError,
} from "../../lib/community-scope.js";
import {
  assertRoomHasVacancy,
  resolveRoomPlacement,
} from "./room-assignment.service.js";

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
  options?: { excludeRequestId?: string; excludeResidentId?: string },
): Promise<{ email: boolean; studentId: boolean }> {
  const excludeId = options?.excludeRequestId;
  const excludeResidentId = options?.excludeResidentId;
  const pendingFilter = excludeId
    ? { _id: { $ne: excludeId }, status: "pending" as const }
    : { status: "pending" as const };

  const residentEmailFilter: Record<string, unknown> = { email };
  const residentIdFilter: Record<string, unknown> = { studentId };
  if (excludeResidentId) {
    residentEmailFilter._id = { $ne: excludeResidentId };
    residentIdFilter._id = { $ne: excludeResidentId };
  }

  const [residentEmail, residentId, pendingEmail, pendingId] = await Promise.all([
    Resident.findOne(residentEmailFilter).lean(),
    Resident.findOne(residentIdFilter).lean(),
    ResidentChangeRequest.findOne({ email, ...pendingFilter }).lean(),
    ResidentChangeRequest.findOne({ studentId, ...pendingFilter }).lean(),
  ]);

  return {
    email: !!(residentEmail || pendingEmail),
    studentId: !!(residentId || pendingId),
  };
}

async function assertGaSubmitter(
  submitter: HydratedDocument<IUser>,
): Promise<ResidentChangeSubmitterRole> {
  const role = submitter.role as ResidentChangeSubmitterRole;
  if (role !== "GA") {
    throw scopeError("Only Area Directors can submit resident change requests", 403);
  }
  return role;
}

async function assertNoPendingChangeForResident(
  residentId: string,
  excludeRequestId?: string,
): Promise<void> {
  const filter: Record<string, unknown> = {
    residentId,
    status: "pending",
    requestType: { $in: ["update", "remove"] },
  };
  if (excludeRequestId) filter._id = { $ne: excludeRequestId };

  const existing = await ResidentChangeRequest.findOne(filter).lean();
  if (existing) {
    throw scopeError(
      "This resident already has a pending update or removal request",
      409,
    );
  }
}

export async function createResidentRequest(
  submitter: HydratedDocument<IUser>,
  payload: ResidentRequestPayload,
  options?: { batchId?: string; batchRowIndex?: number },
): Promise<{ requestId: string }> {
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

  const role = await assertGaSubmitter(submitter);

  const { canonicalSection, roomDoc } = await assertRoomHasVacancy(
    row.community,
    row.section,
    row.room,
  );

  const doc = await ResidentChangeRequest.create({
    requestType: "add",
    status: "pending",
    community: row.community,
    section: canonicalSection,
    room: roomDoc.room,
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

function buildUpdatePayload(
  resident: ResidentLean,
  body: ResidentUpdateRequestPayload,
): ResidentRequestPayload {
  const firstName = body.firstName?.trim() ?? resident.firstName;
  const lastName = body.lastName?.trim() ?? resident.lastName;
  return {
    firstName,
    lastName,
    fullName:
      body.fullName?.trim() ||
      `${firstName} ${lastName}`.trim(),
    email: body.email?.trim() ?? resident.email,
    studentId: body.studentId?.trim() ?? resident.studentId,
    community: resident.community,
    section: resident.section,
    room: resident.room,
    notes: body.notes !== undefined ? body.notes?.trim() : resident.notes,
  };
}

export async function createResidentUpdateRequest(
  submitter: HydratedDocument<IUser>,
  residentId: string,
  body: ResidentUpdateRequestPayload,
  lockedCommunity: string,
): Promise<{ requestId: string }> {
  const resident = await Resident.findById(residentId).lean<ResidentLean>();
  if (!resident || resident.community !== lockedCommunity) {
    throw scopeError("Resident not found", 404);
  }

  for (const key of Object.keys(body)) {
    if (
      !GA_UPDATABLE_FIELDS.includes(
        key as (typeof GA_UPDATABLE_FIELDS)[number],
      )
    ) {
      throw scopeError(`Field "${key}" cannot be changed via request`, 400);
    }
  }

  const row = buildUpdatePayload(resident, body);
  const requiredErr = validateRequired(row);
  if (requiredErr) {
    throw scopeError(requiredErr, 400);
  }

  const dupes = await findDuplicateFlags(row.email, row.studentId, {
    excludeResidentId: residentId,
  });
  if (dupes.email || dupes.studentId) {
    throw scopeError(
      "A resident or pending request already exists with this email or student ID",
      409,
    );
  }

  const role = await assertGaSubmitter(submitter);
  await assertNoPendingChangeForResident(residentId);

  const doc = await ResidentChangeRequest.create({
    requestType: "update",
    status: "pending",
    residentId,
    community: resident.community,
    section: resident.section,
    room: resident.room,
    fullName: row.fullName,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    studentId: row.studentId,
    notes: row.notes,
    previousSnapshot: { ...resident },
    submittedBy: submitter._id,
    submittedByRole: role,
    submittedByEmail: submitter.email,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { requestId: String(doc._id) };
}

export async function createResidentRemoveRequest(
  submitter: HydratedDocument<IUser>,
  residentId: string,
  lockedCommunity: string,
  removalReason?: string,
): Promise<{ requestId: string }> {
  const resident = await Resident.findById(residentId).lean<ResidentLean>();
  if (!resident || resident.community !== lockedCommunity) {
    throw scopeError("Resident not found", 404);
  }

  const role = await assertGaSubmitter(submitter);
  await assertNoPendingChangeForResident(residentId);

  const doc = await ResidentChangeRequest.create({
    requestType: "remove",
    status: "pending",
    residentId,
    community: resident.community,
    section: resident.section,
    room: resident.room,
    fullName: resident.fullName,
    firstName: resident.firstName,
    lastName: resident.lastName,
    email: resident.email,
    studentId: resident.studentId,
    notes: resident.notes,
    previousSnapshot: { ...resident },
    removalReason: removalReason?.trim(),
    submittedBy: submitter._id,
    submittedByRole: role,
    submittedByEmail: submitter.email,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { requestId: String(doc._id) };
}

export async function listResidentChangeRequests(options: {
  status?: string;
  community?: string;
  submittedBy?: string;
  requestType?: string;
  limit: number;
  cursor?: string;
}) {
  const limit = Math.min(Math.max(options.limit, 1), 100);
  const filter: Record<string, unknown> = {};
  if (options.status) filter.status = options.status;
  if (options.community) filter.community = options.community;
  if (options.submittedBy) filter.submittedBy = options.submittedBy;
  if (options.requestType) filter.requestType = options.requestType;
  if (options.cursor) filter._id = { $gt: options.cursor };

  const items = await ResidentChangeRequest.find(filter)
    .sort({ _id: 1 })
    .limit(limit + 1)
    .lean();

  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? String(page[page.length - 1]?._id) : null;

  return { items: page, nextCursor };
}

function requestTypeOf(
  request: { requestType?: ResidentChangeRequestType },
): ResidentChangeRequestType {
  return request.requestType ?? "add";
}

export async function approveResidentChangeRequest(
  requestId: string,
  reviewerId: string,
): Promise<void> {
  const request = await ResidentChangeRequest.findById(requestId);
  if (!request) {
    throw scopeError("Request not found", 404);
  }
  if (request.status !== "pending") {
    throw scopeError("Request is not pending", 400);
  }

  const type = requestTypeOf(request);

  if (type === "add") {
    await approveAddRequest(request, reviewerId);
  } else if (type === "update") {
    await approveUpdateRequest(request, reviewerId);
  } else if (type === "remove") {
    await approveRemoveRequest(request, reviewerId);
  } else {
    throw scopeError("Unknown request type", 400);
  }
}

async function approveAddRequest(
  request: InstanceType<typeof ResidentChangeRequest>,
  reviewerId: string,
): Promise<void> {
  const dupes = await findDuplicateFlags(request.email, request.studentId, {
    excludeRequestId: String(request._id),
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

  await assertRoomHasVacancy(
    request.community,
    request.section,
    request.room,
    { excludeRequestId: String(request._id) },
  );

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

async function approveUpdateRequest(
  request: InstanceType<typeof ResidentChangeRequest>,
  reviewerId: string,
): Promise<void> {
  if (!request.residentId) {
    throw scopeError("Update request missing resident", 400);
  }

  const dupes = await findDuplicateFlags(request.email, request.studentId, {
    excludeRequestId: String(request._id),
    excludeResidentId: String(request.residentId),
  });
  if (dupes.email || dupes.studentId) {
    throw scopeError(
      "Cannot approve: duplicate email or student ID",
      409,
    );
  }

  const updated = await Resident.findByIdAndUpdate(
    request.residentId,
    {
      fullName: request.fullName,
      firstName: request.firstName,
      lastName: request.lastName,
      email: request.email,
      studentId: request.studentId,
      notes: request.notes,
      updatedAt: new Date(),
    },
    { new: true },
  );
  if (!updated) {
    throw scopeError("Resident no longer exists", 404);
  }

  request.status = "approved";
  request.reviewedBy = reviewerId as unknown as typeof request.reviewedBy;
  request.reviewedAt = new Date();
  request.updatedAt = new Date();
  await request.save();
}

async function approveRemoveRequest(
  request: InstanceType<typeof ResidentChangeRequest>,
  reviewerId: string,
): Promise<void> {
  if (!request.residentId) {
    throw scopeError("Removal request missing resident", 400);
  }

  const deleted = await Resident.findByIdAndDelete(request.residentId);
  if (!deleted) {
    throw scopeError("Resident no longer exists", 404);
  }

  request.status = "approved";
  request.reviewedBy = reviewerId as unknown as typeof request.reviewedBy;
  request.reviewedAt = new Date();
  request.updatedAt = new Date();
  await request.save();
}

export async function rejectResidentChangeRequest(
  requestId: string,
  reviewerId: string,
  reason?: string,
): Promise<void> {
  const request = await ResidentChangeRequest.findById(requestId);
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

/** @deprecated use approveResidentChangeRequest */
export const promoteRequestToResident = approveResidentChangeRequest;

/** @deprecated use rejectResidentChangeRequest */
export const rejectResidentRequest = rejectResidentChangeRequest;

/** @deprecated use listResidentChangeRequests */
export const listResidentRequests = listResidentChangeRequests;
