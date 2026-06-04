import mongoose from "mongoose";
import { scopeError } from "../../lib/community-scope.js";
import {
  Community,
  Room,
  Resident,
  SectionStaff,
  CommunityStaff,
  User,
  AuthorizedUser,
  Incident,
  Roomcheck,
  ResidentAdditionRequest,
  type RoomLean,
  type CommunityLean,
  type SectionStaffLean,
} from "../../lib/models.js";

export function normalizeStructureName(name: string): string {
  return name.trim();
}

function sectionMatches(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function findCanonicalSection(
  sections: string[],
  name: string,
): string | undefined {
  return sections.find((s) => sectionMatches(s, name));
}

export async function getCommunityOrThrow(communityName: string) {
  const doc = await Community.findOne({ community: communityName }).lean<CommunityLean>();
  if (!doc) {
    throw scopeError("Community not found", 404);
  }
  return doc;
}

export async function createCommunity(
  name: string,
  sections: string[] = [],
): Promise<{ community: string; sections: string[] }> {
  const community = normalizeStructureName(name);
  if (!community) {
    throw scopeError("Community name is required", 400);
  }

  const existing = await Community.findOne({ community });
  if (existing) {
    throw scopeError("Community already exists", 409);
  }

  const uniqueSections: string[] = [];
  for (const s of sections) {
    const n = normalizeStructureName(s);
    if (!n) continue;
    if (!uniqueSections.some((x) => sectionMatches(x, n))) {
      uniqueSections.push(n);
    }
  }

  await Community.create({
    community,
    section: uniqueSections,
    updatedAt: new Date(),
  } as Parameters<typeof Community.create>[0]);

  return { community, sections: uniqueSections };
}

export async function renameCommunity(
  oldName: string,
  newName: string,
): Promise<void> {
  const from = normalizeStructureName(oldName);
  const to = normalizeStructureName(newName);
  if (!to) throw scopeError("New community name is required", 400);
  if (from === to) return;

  const doc = await getCommunityOrThrow(from);
  const taken = await Community.findOne({ community: to });
  if (taken) {
    throw scopeError("A community with that name already exists", 409);
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Community.updateOne(
        { community: from },
        { $set: { community: to, updatedAt: new Date() } },
        { session },
      );

      const filter = { community: from };
      const setCommunity = { $set: { community: to } };

      await Promise.all([
        Room.updateMany(filter, setCommunity, { session }),
        Resident.updateMany(filter, setCommunity, { session }),
        SectionStaff.updateMany(filter, setCommunity, { session }),
        CommunityStaff.updateMany(filter, setCommunity, { session }),
        Incident.updateMany(filter, setCommunity, { session }),
        Roomcheck.updateMany(filter, setCommunity, { session }),
        ResidentAdditionRequest.updateMany(filter, setCommunity, { session }),
      ]);

      const users = await User.find({ community: from }).session(session);
      for (const u of users) {
        u.community = [...new Set((u.community ?? []).map((c) => (c === from ? to : c)))];
        await u.save({ session });
      }

      const authorized = await AuthorizedUser.find({ community: from }).session(
        session,
      );
      for (const a of authorized) {
        a.community = [...new Set((a.community ?? []).map((c) => (c === from ? to : c)))];
        await a.save({ session });
      }
    });
  } finally {
    await session.endSession();
  }
}

export async function deleteCommunity(communityName: string): Promise<void> {
  const name = normalizeStructureName(communityName);
  await getCommunityOrThrow(name);

  const residentCount = await Resident.countDocuments({ community: name });
  if (residentCount > 0) {
    throw scopeError(
      "Cannot delete community while residents are assigned. Move or remove residents first.",
      409,
    );
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Promise.all([
        Room.deleteMany({ community: name }, { session }),
        SectionStaff.deleteMany({ community: name }, { session }),
        CommunityStaff.deleteMany({ community: name }, { session }),
        Roomcheck.deleteMany({ community: name }, { session }),
        Incident.deleteMany({ community: name }, { session }),
        ResidentAdditionRequest.deleteMany({ community: name }, { session }),
      ]);

      const users = await User.find({ community: name }).session(session);
      for (const u of users) {
        u.community = (u.community ?? []).filter((c) => c !== name);
        await u.save({ session });
      }

      const authorized = await AuthorizedUser.find({
        community: name,
      }).session(session);
      for (const a of authorized) {
        a.community = (a.community ?? []).filter((c) => c !== name);
        await a.save({ session });
      }

      await Community.deleteOne({ community: name }, { session });
    });
  } finally {
    await session.endSession();
  }
}

export async function addSection(
  communityName: string,
  sectionName: string,
): Promise<string[]> {
  const name = normalizeStructureName(sectionName);
  if (!name) throw scopeError("Section name is required", 400);

  const doc = await getCommunityOrThrow(communityName);
  const sections = doc.section ?? [];
  if (findCanonicalSection(sections, name)) {
    throw scopeError("Section already exists in this community", 409);
  }

  const nextSections = [...sections, name];
  await Community.updateOne(
    { community: communityName },
    { $set: { section: nextSections, updatedAt: new Date() } },
  );
  return nextSections;
}

export async function renameSection(
  communityName: string,
  oldSection: string,
  newSection: string,
): Promise<string[]> {
  const to = normalizeStructureName(newSection);
  if (!to) throw scopeError("New section name is required", 400);

  const doc = await getCommunityOrThrow(communityName);
  const sections = doc.section ?? [];
  const from = findCanonicalSection(sections, oldSection);
  if (!from) {
    throw scopeError("Section not found in this community", 404);
  }
  if (sectionMatches(from, to)) {
    return sections;
  }
  if (findCanonicalSection(sections, to)) {
    throw scopeError("A section with that name already exists", 409);
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const nextSections = sections.map((s: string) => (s === from ? to : s));
      await Community.updateOne(
        { community: communityName },
        { $set: { section: nextSections, updatedAt: new Date() } },
        { session },
      );

      const filter = { community: communityName, section: from };
      const setSection = { $set: { section: to } };

      await Promise.all([
        Room.updateMany(filter, setSection, { session }),
        Resident.updateMany(filter, setSection, { session }),
        SectionStaff.updateMany(filter, setSection, { session }),
        Incident.updateMany(filter, setSection, { session }),
        Roomcheck.updateMany(filter, setSection, { session }),
        ResidentAdditionRequest.updateMany(filter, setSection, { session }),
      ]);

      const ras = await User.find({
        role: "RA",
        community: communityName,
        assignment: from,
      }).session(session);
      for (const u of ras) {
        u.assignment = (u.assignment ?? []).map((a) => (a === from ? to : a));
        await u.save({ session });
      }
    });
  } finally {
    await session.endSession();
  }

  const updated = await Community.findOne({ community: communityName }).lean<CommunityLean>();
  return updated?.section ?? [];
}

export async function removeSection(
  communityName: string,
  sectionName: string,
): Promise<string[]> {
  const doc = await getCommunityOrThrow(communityName);
  const sections = doc.section ?? [];
  const canonical = findCanonicalSection(sections, sectionName);
  if (!canonical) {
    throw scopeError("Section not found in this community", 404);
  }

  const roomCount = await Room.countDocuments({
    community: communityName,
    section: canonical,
  });
  if (roomCount > 0) {
    throw scopeError(
      "Remove all rooms in this section before deleting the section",
      409,
    );
  }

  const residentCount = await Resident.countDocuments({
    community: communityName,
    section: canonical,
  });
  if (residentCount > 0) {
    throw scopeError(
      "Cannot delete section while residents are assigned",
      409,
    );
  }

  const staff = await SectionStaff.findOne({
    community: communityName,
    section: canonical,
  });
  if (staff) {
    throw scopeError(
      "Remove section staff assignment before deleting this section",
      409,
    );
  }

  const pending = await ResidentAdditionRequest.countDocuments({
    community: communityName,
    section: canonical,
    status: "pending",
  });
  if (pending > 0) {
    throw scopeError(
      "Resolve pending resident requests for this section first",
      409,
    );
  }

  const nextSections = sections.filter((s: string) => s !== canonical);
  await Community.updateOne(
    { community: communityName },
    { $set: { section: nextSections, updatedAt: new Date() } },
  );
  return nextSections;
}

export async function listRooms(options: {
  community: string;
  section?: string;
  limit: number;
  cursor?: string;
}): Promise<{ items: RoomLean[]; nextCursor: string | null }> {
  const limit = Math.min(Math.max(options.limit, 1), 100);
  const filter: Record<string, unknown> = { community: options.community };
  if (options.section) {
    const doc = await getCommunityOrThrow(options.community);
    const canonical = findCanonicalSection(doc.section ?? [], options.section);
    if (!canonical) {
      throw scopeError("Section not found in this community", 404);
    }
    filter.section = canonical;
  }
  if (options.cursor) {
    filter._id = { $gt: options.cursor };
  }

  const items = await Room.find(filter)
    .sort({ _id: 1 })
    .limit(limit + 1)
    .lean<RoomLean[]>();

  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? String(page[page.length - 1]?._id) : null;
  return { items: page, nextCursor };
}

export async function createRoom(
  communityName: string,
  data: {
    section: string;
    room: string;
    capacity: number;
    keyCount?: number;
    keyCode?: string;
  },
): Promise<RoomLean> {
  const doc = await getCommunityOrThrow(communityName);
  const section = findCanonicalSection(doc.section ?? [], data.section);
  if (!section) {
    throw scopeError("Section does not exist in this community", 400);
  }

  const roomNumber = normalizeStructureName(data.room);
  if (!roomNumber) throw scopeError("Room number is required", 400);

  const capacity = Number(data.capacity);
  if (!Number.isFinite(capacity) || capacity < 1) {
    throw scopeError("Capacity must be at least 1", 400);
  }

  try {
    const created = await Room.create({
      community: communityName,
      section,
      room: roomNumber,
      capacity,
      keyCount: data.keyCount ?? 0,
      keyCode: data.keyCode?.trim(),
      createdAt: new Date(),
    });
    return created.toObject() as unknown as RoomLean;
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      throw scopeError("This room already exists in the section", 409);
    }
    throw err;
  }
}

export async function createRoomsBulk(
  communityName: string,
  payload: {
    sections: string[];
    rooms: string[];
    capacity?: number;
  },
): Promise<{ created: number; failed: { section: string; room: string; message: string }[] }> {
  const doc = await getCommunityOrThrow(communityName);
  const communitySections = doc.section ?? [];

  if (!payload.sections?.length || !payload.rooms?.length) {
    throw scopeError("Sections and room numbers are required", 400);
  }

  const capacity = payload.capacity ?? 1;
  let created = 0;
  const failed: { section: string; room: string; message: string }[] = [];

  for (const sectionInput of payload.sections) {
    const section = findCanonicalSection(communitySections, sectionInput);
    if (!section) {
      failed.push({
        section: sectionInput,
        room: "*",
        message: "Section not in community",
      });
      continue;
    }

    for (const roomInput of payload.rooms) {
      try {
        await createRoom(communityName, {
          section,
          room: roomInput,
          capacity,
        });
        created++;
      } catch (err) {
        failed.push({
          section,
          room: roomInput,
          message: err instanceof Error ? err.message : "Failed",
        });
      }
    }
  }

  return { created, failed };
}

export async function updateRoom(
  communityName: string,
  roomId: string,
  updates: {
    section?: string;
    room?: string;
    capacity?: number;
    keyCount?: number;
    keyCode?: string;
  },
): Promise<RoomLean> {
  const existing = await Room.findOne({
    _id: roomId,
    community: communityName,
  });
  if (!existing) {
    throw scopeError("Room not found", 404);
  }

  const doc = await getCommunityOrThrow(communityName);
  let section = existing.section;
  if (updates.section !== undefined) {
    const canonical = findCanonicalSection(doc.section ?? [], updates.section);
    if (!canonical) {
      throw scopeError("Section does not exist in this community", 400);
    }
    section = canonical;
  }

  const roomNumber =
    updates.room !== undefined
      ? normalizeStructureName(updates.room)
      : existing.room;
  if (!roomNumber) throw scopeError("Room number is required", 400);

  const capacity =
    updates.capacity !== undefined ? Number(updates.capacity) : existing.capacity;
  if (!Number.isFinite(capacity) || capacity < 1) {
    throw scopeError("Capacity must be at least 1", 400);
  }

  const sectionChanged = section !== existing.section;
  const roomChanged = roomNumber !== existing.room;

  if (sectionChanged || roomChanged) {
    const residents = await Resident.countDocuments({
      community: communityName,
      section: existing.section,
      room: existing.room,
    });
    if (residents > 0) {
      await Resident.updateMany(
        {
          community: communityName,
          section: existing.section,
          room: existing.room,
        },
        { $set: { section, room: roomNumber } },
      );
      await Roomcheck.updateMany(
        {
          community: communityName,
          section: existing.section,
          room: existing.room,
        },
        { $set: { section, room: roomNumber } },
      );
    }
  }

  existing.section = section;
  existing.room = roomNumber;
  existing.capacity = capacity;
  if (updates.keyCount !== undefined) existing.keyCount = updates.keyCount;
  if (updates.keyCode !== undefined) existing.keyCode = updates.keyCode?.trim();

  try {
    await existing.save();
    return existing.toObject() as unknown as RoomLean;
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      throw scopeError("This room already exists in the section", 409);
    }
    throw err;
  }
}

export async function deleteRoom(
  communityName: string,
  roomId: string,
): Promise<void> {
  const existing = await Room.findOne({
    _id: roomId,
    community: communityName,
  });
  if (!existing) {
    throw scopeError("Room not found", 404);
  }

  const residents = await Resident.countDocuments({
    community: communityName,
    section: existing.section,
    room: existing.room,
  });
  if (residents > 0) {
    throw scopeError(
      "Cannot delete room while residents are assigned to it",
      409,
    );
  }

  await Room.deleteOne({ _id: existing._id });
}

export async function getSectionSummaries(communityName: string) {
  const doc = await Community.findOne({ community: communityName }).lean<CommunityLean>();
  const sections = doc?.section ?? [];

  const summaries = await Promise.all(
    sections.map(async (sectionName: string) => {
      const [roomCount, residentCount, staff] = await Promise.all([
        Room.countDocuments({ community: communityName, section: sectionName }),
        Resident.countDocuments({
          community: communityName,
          section: sectionName,
        }),
        SectionStaff.findOne({
          community: communityName,
          section: sectionName,
        }).lean<SectionStaffLean>(),
      ]);
      return {
        name: sectionName,
        roomCount,
        residentCount,
        hasRa: Boolean(staff?.raEmail),
      };
    }),
  );

  return summaries;
}
