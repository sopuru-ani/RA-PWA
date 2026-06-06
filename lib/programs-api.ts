import { apiFetch } from "@/lib/api-client";
import type {
  CalendarEvent,
  CreateProgramInput,
  Program,
  ProgramInvite,
  ProgramStats,
  RsvpStatus,
  AttendanceStatus,
} from "@/types/programs";

async function parseJson<T>(res: Response): Promise<T & { msg?: string }> {
  return res.json() as Promise<T & { msg?: string }>;
}

export async function fetchPrograms(params?: {
  from?: string;
  to?: string;
}): Promise<Program[]> {
  const qs = new URLSearchParams();
  if (params?.from) qs.set("from", params.from);
  if (params?.to) qs.set("to", params.to);
  const suffix = qs.toString() ? `?${qs}` : "";
  const res = await apiFetch(`api/programs${suffix}`, { method: "GET" });
  const data = await parseJson<{ programs: Program[] }>(res);
  if (!res.ok) throw new Error(data.msg ?? "Failed to load programs");
  return data.programs ?? [];
}

export async function fetchMonitoringPrograms(): Promise<Program[]> {
  const res = await apiFetch("api/programs/monitoring", { method: "GET" });
  const data = await parseJson<{ programs: Program[] }>(res);
  if (!res.ok) throw new Error(data.msg ?? "Failed to load programs");
  return data.programs ?? [];
}

export async function fetchPendingPrograms(): Promise<Program[]> {
  const res = await apiFetch("api/programs/pending", { method: "GET" });
  const data = await parseJson<{ programs: Program[] }>(res);
  if (!res.ok) throw new Error(data.msg ?? "Failed to load pending programs");
  return data.programs ?? [];
}

export async function fetchCalendarEvents(
  from: string,
  to: string,
): Promise<CalendarEvent[]> {
  const qs = new URLSearchParams({ from, to });
  const res = await apiFetch(`api/programs/calendar?${qs}`, { method: "GET" });
  const data = await parseJson<{ events: CalendarEvent[] }>(res);
  if (!res.ok) throw new Error(data.msg ?? "Failed to load calendar");
  return data.events ?? [];
}

export async function fetchProgramStats(): Promise<ProgramStats> {
  const res = await apiFetch("api/programs/stats", { method: "GET" });
  const data = await parseJson<{ programStats: ProgramStats }>(res);
  if (!res.ok) throw new Error(data.msg ?? "Failed to load stats");
  return data.programStats;
}

export async function fetchProgram(id: string): Promise<{
  program: Program;
  invite?: ProgramInvite;
}> {
  const res = await apiFetch(`api/programs/${id}`, { method: "GET" });
  const data = await parseJson<{ program: Program; invite?: ProgramInvite }>(
    res,
  );
  if (!res.ok) throw new Error(data.msg ?? "Failed to load program");
  return { program: data.program, invite: data.invite };
}

export async function createProgram(
  input: CreateProgramInput,
): Promise<Program> {
  const res = await apiFetch("api/programs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJson<{ program: Program }>(res);
  if (!res.ok) throw new Error(data.msg ?? "Failed to create program");
  return data.program;
}

export async function updateProgram(
  id: string,
  input: Partial<CreateProgramInput>,
): Promise<Program> {
  const res = await apiFetch(`api/programs/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJson<{ program: Program }>(res);
  if (!res.ok) throw new Error(data.msg ?? "Failed to update program");
  return data.program;
}

export async function submitProgram(id: string): Promise<Program> {
  const res = await apiFetch(`api/programs/${id}/submit`, { method: "POST" });
  const data = await parseJson<{ program: Program }>(res);
  if (!res.ok) throw new Error(data.msg ?? "Failed to submit program");
  return data.program;
}

export async function publishProgram(
  id: string,
): Promise<{ program: Program; inviteCount: number }> {
  const res = await apiFetch(`api/programs/${id}/publish`, { method: "POST" });
  const data = await parseJson<{ program: Program; inviteCount: number }>(res);
  if (!res.ok) throw new Error(data.msg ?? "Failed to publish program");
  return data;
}

export async function approveProgram(
  id: string,
): Promise<{ program: Program; inviteCount: number }> {
  const res = await apiFetch(`api/programs/${id}/approve`, { method: "POST" });
  const data = await parseJson<{ program: Program; inviteCount: number }>(res);
  if (!res.ok) throw new Error(data.msg ?? "Failed to approve program");
  return data;
}

export async function rejectProgram(
  id: string,
  rejectionReason?: string,
): Promise<Program> {
  const res = await apiFetch(`api/programs/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rejectionReason }),
  });
  const data = await parseJson<{ program: Program }>(res);
  if (!res.ok) throw new Error(data.msg ?? "Failed to reject program");
  return data.program;
}

export async function cancelProgram(id: string): Promise<Program> {
  const res = await apiFetch(`api/programs/${id}/cancel`, { method: "POST" });
  const data = await parseJson<{ program: Program }>(res);
  if (!res.ok) throw new Error(data.msg ?? "Failed to cancel program");
  return data.program;
}

export async function updateRsvp(
  id: string,
  rsvpStatus: RsvpStatus,
): Promise<ProgramInvite> {
  const res = await apiFetch(`api/programs/${id}/rsvp`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rsvpStatus }),
  });
  const data = await parseJson<{ invite: ProgramInvite }>(res);
  if (!res.ok) throw new Error(data.msg ?? "Failed to update RSVP");
  return data.invite;
}

export function toIsoFromLocal(date: string, time: string): string {
  return new Date(`${date}T${time || "00:00"}`).toISOString();
}

export function splitIsoToLocal(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export function calendarRangeForMonth(year: number, month: number) {
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return { from: fmt(from), to: fmt(to) };
}

/** Max range the API allows (90 days). Client uses 89 to stay safely within the cap. */
export const CALENDAR_MAX_FETCH_DAYS = 89;

/** Visible window for the calendar: previous month through ~3 months ahead, within API limits. */
export function calendarFetchRange(anchor = new Date()): { from: string; to: string } {
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const from = new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1);
  const to = new Date(from);
  to.setDate(to.getDate() + CALENDAR_MAX_FETCH_DAYS);

  return { from: fmt(from), to: fmt(to) };
}

export type AttendanceRow = ProgramInvite & {
  user?: { fullName: string; email: string; role: string };
};

export async function fetchAttendance(id: string): Promise<AttendanceRow[]> {
  const res = await apiFetch(`api/programs/${id}/attendance`, { method: "GET" });
  const data = await parseJson<{ invites: AttendanceRow[] }>(res);
  if (!res.ok) throw new Error(data.msg ?? "Failed to load attendance");
  return data.invites ?? [];
}

export async function updateAttendance(
  id: string,
  updates: { userId: string; attendanceStatus: AttendanceStatus }[],
): Promise<void> {
  const res = await apiFetch(`api/programs/${id}/attendance`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ updates }),
  });
  const data = await parseJson<{ msg?: string }>(res);
  if (!res.ok) throw new Error(data.msg ?? "Failed to update attendance");
}

export type ProgramConflict = {
  programId: string;
  title: string;
  startDate: string;
  endDate: string;
};

export async function fetchProgramConflicts(
  startDate: string,
  endDate: string,
  excludeId?: string,
): Promise<ProgramConflict[]> {
  const qs = new URLSearchParams({ startDate, endDate });
  if (excludeId) qs.set("excludeId", excludeId);
  const res = await apiFetch(`api/programs/conflicts?${qs}`, { method: "GET" });
  const data = await parseJson<{ conflicts: ProgramConflict[] }>(res);
  if (!res.ok) throw new Error(data.msg ?? "Failed to check conflicts");
  return data.conflicts ?? [];
}

export async function downloadAttendanceCsv(programId: string): Promise<void> {
  const base = process.env.NEXT_PUBLIC_BASE_URL_LAN ?? "";
  const res = await apiFetch(`api/programs/${programId}/attendance/export`, {
    method: "GET",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { msg?: string }).msg ?? "Failed to export attendance",
    );
  }
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition");
  const match = disposition?.match(/filename="([^"]+)"/);
  const filename = match?.[1] ?? `attendance-${programId}.csv`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function addProgramAttachment(
  programId: string,
  input: { filename: string; bucket: string; mimeType?: string; size?: number },
): Promise<Program> {
  const res = await apiFetch(`api/programs/${programId}/attachments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJson<{ program: Program }>(res);
  if (!res.ok) throw new Error(data.msg ?? "Failed to add attachment");
  return data.program;
}

export async function removeProgramAttachment(
  programId: string,
  attachmentId: string,
): Promise<Program> {
  const res = await apiFetch(
    `api/programs/${programId}/attachments/${attachmentId}`,
    { method: "DELETE" },
  );
  const data = await parseJson<{ program: Program }>(res);
  if (!res.ok) throw new Error(data.msg ?? "Failed to remove attachment");
  return data.program;
}

export async function sendProgramReminders(): Promise<{
  scanned: number;
  sent: number;
  skipped: number;
  errors: string[];
}> {
  const res = await apiFetch("api/programs/reminders/send", { method: "POST" });
  const data = await parseJson<{
    result: {
      scanned: number;
      sent: number;
      skipped: number;
      errors: string[];
    };
  }>(res);
  if (!res.ok) throw new Error(data.msg ?? "Failed to send reminders");
  return data.result;
}
