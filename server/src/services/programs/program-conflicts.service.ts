import type { HydratedDocument } from "mongoose";
import type { IUser } from "../../../db/user.model.js";
import { Program, ProgramInvite, type ProgramLean } from "../../lib/models.js";
import { scopeError } from "../../lib/community-scope.js";

export type ProgramConflict = {
  programId: string;
  title: string;
  startDate: string;
  endDate: string;
};

function parseDate(value: string, field: string): Date {
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    throw scopeError(`${field} is invalid`, 400);
  }
  return d;
}

function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export async function getProgramConflicts(
  user: HydratedDocument<IUser>,
  startDate: string,
  endDate: string,
  excludeProgramId?: string,
): Promise<ProgramConflict[]> {
  const rangeStart = parseDate(startDate, "startDate");
  const rangeEnd = parseDate(endDate, "endDate");

  if (rangeEnd < rangeStart) {
    throw scopeError("endDate must be after startDate", 400);
  }

  const invites = await ProgramInvite.find({ userId: user._id }).select(
    "programId",
  );
  const programIds = invites.map((i) => i.programId);

  if (programIds.length === 0) {
    return [];
  }

  const scopedIds = excludeProgramId
    ? programIds.filter((id) => String(id) !== excludeProgramId)
    : programIds;

  if (scopedIds.length === 0) {
    return [];
  }

  const filter: Record<string, unknown> = {
    _id: { $in: scopedIds },
    status: "published",
    startDate: { $lt: rangeEnd },
    endDate: { $gt: rangeStart },
  };

  const programs = await Program.find(filter)
    .select("title startDate endDate")
    .lean<ProgramLean[]>();

  return programs
    .filter((p) => String(p._id) !== excludeProgramId)
    .filter((p) =>
      rangesOverlap(
        rangeStart,
        rangeEnd,
        new Date(p.startDate),
        new Date(p.endDate),
      ),
    )
    .map((p) => ({
      programId: String(p._id),
      title: p.title,
      startDate: new Date(p.startDate).toISOString(),
      endDate: new Date(p.endDate).toISOString(),
    }));
}
