import {
  Resident,
  SectionStaff,
  type ResidentLean,
  type SectionStaffLean,
} from "../../lib/models.js";
import {
  attachStaffToResidents,
  buildStaffMap,
} from "../../../db/residentStaff.js";

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
