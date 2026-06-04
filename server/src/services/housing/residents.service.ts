import {
  Community,
  Resident,
  SectionStaff,
  type ResidentLean,
  type SectionStaffLean,
} from "../../lib/models.js";
import {
  attachStaffToResidents,
  buildStaffMap,
} from "../../../db/residentStaff.js";
import { scopeError } from "../../lib/community-scope.js";
import type { ResidentUpdateRequestPayload } from "../../../db/residentChangeRequest.model.js";
import { GA_UPDATABLE_FIELDS } from "../../../db/residentChangeRequest.model.js";
import { assertRoomHasVacancy } from "./room-assignment.service.js";
import { findDuplicateFlags } from "./resident-change-requests.service.js";

export async function listResidents(options: {
  limit: number;
  community?: string;
  section?: string;
  q?: string;
  cursor?: string;
}): Promise<{
  items: ReturnType<typeof attachStaffToResidents>;
  nextCursor: string | null;
}> {
  const limit = Math.min(Math.max(options.limit, 1), 100);
  const filter: Record<string, unknown> = {};
  if (options.community) filter.community = options.community;
  if (options.section) filter.section = options.section;
  if (options.q) {
    filter.$or = [
      { fullName: { $regex: options.q, $options: "i" } },
      { email: { $regex: options.q, $options: "i" } },
      { room: { $regex: options.q, $options: "i" } },
      { studentId: { $regex: options.q, $options: "i" } },
    ];
  }
  if (options.cursor) {
    filter._id = { $gt: options.cursor };
  }

  const residents = await Resident.find(filter)
    .sort({ _id: 1 })
    .limit(limit + 1)
    .lean<ResidentLean[]>();

  const hasMore = residents.length > limit;
  const page = hasMore ? residents.slice(0, limit) : residents;
  const nextCursor = hasMore ? String(page[page.length - 1]?._id) : null;

  const pairs = [
    ...new Map(
      page.map((r) => [`${r.community}__${r.section}`, r] as const),
    ).keys(),
  ].map((key) => {
    const [communityKey, sectionKey] = key.split("__");
    return { community: communityKey, section: sectionKey };
  });

  const staffRecords =
    pairs.length > 0
      ? await SectionStaff.find({
          $or: pairs.map(({ community: c, section: s }) => ({
            community: c,
            section: s,
          })),
        }).lean<SectionStaffLean[]>()
      : [];

  const staffMap = buildStaffMap(staffRecords);
  const items = attachStaffToResidents(page, staffMap);

  return { items, nextCursor };
}

export async function getResidentById(id: string) {
  const resident = await Resident.findById(id).lean<ResidentLean>();
  if (!resident) return null;

  const staffRecords = await SectionStaff.find({
    community: resident.community,
    section: resident.section,
  }).lean<SectionStaffLean[]>();

  const staffMap = buildStaffMap(staffRecords);
  const [withStaff] = attachStaffToResidents([resident], staffMap);
  return withStaff;
}

const PLACEMENT_FIELDS = ["community", "section", "room"] as const;

function rejectPlacementFields(body: Record<string, unknown>): void {
  for (const key of PLACEMENT_FIELDS) {
    if (key in body && body[key] !== undefined) {
      throw scopeError(
        "Use Move resident to change community, section, or room",
        400,
      );
    }
  }
}

function buildAdminUpdate(
  resident: ResidentLean,
  body: ResidentUpdateRequestPayload,
): Partial<ResidentLean> {
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
    notes: body.notes !== undefined ? body.notes?.trim() : resident.notes,
  };
}

export async function updateResidentAdmin(
  id: string,
  body: ResidentUpdateRequestPayload & Record<string, unknown>,
): Promise<ReturnType<typeof getResidentById>> {
  rejectPlacementFields(body);

  for (const key of Object.keys(body)) {
    if (
      !GA_UPDATABLE_FIELDS.includes(
        key as (typeof GA_UPDATABLE_FIELDS)[number],
      )
    ) {
      throw scopeError(`Unknown field "${key}"`, 400);
    }
  }

  const resident = await Resident.findById(id).lean<ResidentLean>();
  if (!resident) {
    throw scopeError("Resident not found", 404);
  }

  const updates = buildAdminUpdate(resident, body);
  if (!updates.firstName || !updates.lastName || !updates.email || !updates.studentId) {
    throw scopeError("Required resident fields cannot be empty", 400);
  }

  const dupes = await findDuplicateFlags(updates.email!, updates.studentId!, {
    excludeResidentId: id,
  });
  if (dupes.email || dupes.studentId) {
    throw scopeError(
      "Another resident or pending request uses this email or student ID",
      409,
    );
  }

  await Resident.findByIdAndUpdate(id, {
    ...updates,
    updatedAt: new Date(),
  });

  return getResidentById(id);
}

export async function deleteResidentAdmin(id: string): Promise<void> {
  const deleted = await Resident.findByIdAndDelete(id);
  if (!deleted) {
    throw scopeError("Resident not found", 404);
  }
}

export async function moveResidentAdmin(
  id: string,
  placement: { community: string; section: string; room: string },
): Promise<ReturnType<typeof getResidentById>> {
  const resident = await Resident.findById(id).lean<ResidentLean>();
  if (!resident) {
    throw scopeError("Resident not found", 404);
  }

  const community = placement.community?.trim();
  const section = placement.section?.trim();
  const room = placement.room?.trim();
  if (!community || !section || !room) {
    throw scopeError("Community, section, and room are required", 400);
  }

  const communityDoc = await Community.findOne({ community }).lean();
  if (!communityDoc) {
    throw scopeError("Community does not exist", 400);
  }

  const { canonicalSection, roomDoc } = await assertRoomHasVacancy(
    community,
    section,
    room,
    { excludeResidentId: id },
  );

  const staff = await SectionStaff.findOne({
    community,
    section: canonicalSection,
  }).lean();
  if (!staff) {
    throw scopeError(
      "No section staff record for this community/section. Add SectionStaff first.",
      422,
    );
  }

  await Resident.findByIdAndUpdate(id, {
    community,
    section: canonicalSection,
    room: roomDoc.room,
    updatedAt: new Date(),
  });

  return getResidentById(id);
}
