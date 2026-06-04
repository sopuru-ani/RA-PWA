import {
  Community,
  Resident,
  ResidentChangeRequest,
  Room,
  type ResidentLean,
} from "../../lib/models.js";
import { assertSectionInCommunity, scopeError } from "../../lib/community-scope.js";
import { attachVacancyToRooms } from "../../../db/roomVacancy.js";
import type { RoomLean, RoomWithVacancy } from "../../../db/room.model.js";

function sectionMatches(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function findCanonicalSection(
  sections: string[],
  name: string,
): string | undefined {
  return sections.find((s) => sectionMatches(s, name));
}

export function normalizeRoomNumber(room: string): string {
  return room.trim();
}

export async function resolveRoomPlacement(
  community: string,
  section: string,
  room: string,
): Promise<{ roomDoc: RoomLean; canonicalSection: string }> {
  const communityDoc = await Community.findOne({ community }).lean();
  if (!communityDoc) {
    throw scopeError("Community does not exist", 400);
  }

  const canonicalSection = findCanonicalSection(
    (communityDoc as { section?: string[] }).section ?? [],
    section,
  );
  if (!canonicalSection) {
    throw scopeError("Invalid section for this community", 400);
  }

  const roomNumber = normalizeRoomNumber(room);
  if (!roomNumber) {
    throw scopeError("Room number is required", 400);
  }

  const roomDoc = await Room.findOne({
    community,
    section: canonicalSection,
    room: roomNumber,
  }).lean<RoomLean>();

  if (!roomDoc) {
    throw scopeError("Room does not exist in this community and section", 404);
  }

  return { roomDoc, canonicalSection };
}

function placementKey(community: string, section: string, room: string): string {
  return `${community}__${section}__${room}`;
}

function pendingTargetsRoom(
  request: {
    requestType?: string;
    community: string;
    section: string;
    room: string;
    previousSnapshot?: Record<string, unknown>;
  },
  community: string,
  section: string,
  room: string,
): boolean {
  const type = request.requestType ?? "add";
  if (type === "add") {
    return (
      request.community === community &&
      sectionMatches(request.section, section) &&
      request.room === room
    );
  }
  if (type === "update") {
    const prev = request.previousSnapshot as
      | { community?: string; section?: string; room?: string }
      | undefined;
    const changesPlacement =
      request.community !== prev?.community ||
      !sectionMatches(request.section, prev?.section ?? "") ||
      request.room !== prev?.room;
    if (!changesPlacement) return false;
    return (
      request.community === community &&
      sectionMatches(request.section, section) &&
      request.room === room
    );
  }
  return false;
}

/** Residents plus pending add/update placements that reserve a bed. */
export async function countRoomOccupancy(
  community: string,
  section: string,
  room: string,
  options?: { excludeResidentId?: string; excludeRequestId?: string },
): Promise<number> {
  const residentFilter: Record<string, unknown> = {
    community,
    section,
    room,
  };

  let residentCount = await Resident.countDocuments(residentFilter);

  if (options?.excludeResidentId) {
    const excluded = await Resident.findById(options.excludeResidentId).lean<ResidentLean>();
    if (
      excluded &&
      excluded.community === community &&
      sectionMatches(excluded.section, section) &&
      excluded.room === room
    ) {
      residentCount = Math.max(0, residentCount - 1);
    }
  }

  const pending = await ResidentChangeRequest.find({
    status: "pending",
    requestType: { $in: ["add", "update"] },
  }).lean();

  let pendingReserved = 0;
  for (const req of pending) {
    if (options?.excludeRequestId && String(req._id) === options.excludeRequestId) {
      continue;
    }
    if (pendingTargetsRoom(req, community, section, room)) {
      pendingReserved++;
    }
  }

  return residentCount + pendingReserved;
}

export async function assertRoomHasVacancy(
  community: string,
  section: string,
  room: string,
  options?: { excludeResidentId?: string; excludeRequestId?: string },
): Promise<{ roomDoc: RoomLean; canonicalSection: string }> {
  const { roomDoc, canonicalSection } = await resolveRoomPlacement(
    community,
    section,
    room,
  );

  const occupancy = await countRoomOccupancy(
    community,
    canonicalSection,
    roomDoc.room,
    options,
  );

  if (occupancy >= Number(roomDoc.capacity)) {
    throw scopeError("Room is at capacity", 409);
  }

  return { roomDoc, canonicalSection };
}

export async function listRoomsWithVacancy(
  community: string,
  rooms: RoomLean[],
): Promise<RoomWithVacancy[]> {
  const residents = await Resident.find({ community })
    .select("community section room")
    .lean<Pick<ResidentLean, "community" | "section" | "room">[]>();

  const pending = await ResidentChangeRequest.find({
    status: "pending",
    requestType: { $in: ["add", "update"] },
    community,
  }).lean();

  const syntheticResidents = [...residents];

  for (const req of pending) {
    const type = req.requestType ?? "add";
    if (type !== "add" && type !== "update") continue;
    const prev = req.previousSnapshot as
      | { community?: string; section?: string; room?: string }
      | undefined;
    const changesPlacement =
      type === "add" ||
      req.community !== prev?.community ||
      !sectionMatches(req.section, prev?.section ?? "") ||
      req.room !== prev?.room;
    if (!changesPlacement) continue;

    const canonical = await Community.findOne({ community: req.community }).lean();
    const sections = (canonical as { section?: string[] } | null)?.section ?? [];
    const canonicalSection = findCanonicalSection(sections, req.section);
    if (!canonicalSection) continue;

    syntheticResidents.push({
      community: req.community,
      section: canonicalSection,
      room: req.room,
    });
  }

  return attachVacancyToRooms(rooms, syntheticResidents);
}
