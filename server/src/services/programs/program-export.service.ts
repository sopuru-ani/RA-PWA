import type { HydratedDocument } from "mongoose";
import type { IUser } from "../../../db/user.model.js";
import { canAccessMonitoring } from "../../lib/program-permissions.js";
import { scopeError } from "../../lib/community-scope.js";
import { Program } from "../../lib/models.js";
import { listProgramAttendance } from "./program.service.js";

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function exportAttendanceCsv(
  user: HydratedDocument<IUser>,
  programId: string,
): Promise<string> {
  const program = await Program.findById(programId).lean();
  if (!program) {
    throw scopeError("Program not found", 404);
  }

  if (!canAccessMonitoring(user, program)) {
    throw scopeError("You cannot export attendance for this program", 403);
  }

  const rows = await listProgramAttendance(user, programId);

  const header = [
    "Name",
    "Email",
    "Role",
    "RSVP",
    "Attendance",
    "Checked In At",
  ];

  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        csvEscape(r.user?.fullName ?? ""),
        csvEscape(r.user?.email ?? ""),
        csvEscape(r.user?.role ?? ""),
        csvEscape(r.rsvpStatus),
        csvEscape(r.attendanceStatus),
        csvEscape(r.checkedInAt ? new Date(r.checkedInAt).toISOString() : ""),
      ].join(","),
    ),
  ];

  return lines.join("\n");
}
