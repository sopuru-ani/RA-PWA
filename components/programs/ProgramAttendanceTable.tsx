"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import ListSkeleton from "@/components/housing/ListSkeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNotification } from "@/context/notification-context";
import { roleLabelShort } from "@/lib/role-labels";
import {
  downloadAttendanceCsv,
  fetchAttendance,
  updateAttendance,
  type AttendanceRow,
} from "@/lib/programs-api";
import { RSVP_STATUS_LABELS } from "@/lib/program-labels";
import type { AttendanceStatus } from "@/types/programs";

const ATTENDANCE_OPTIONS: AttendanceStatus[] = [
  "unmarked",
  "attended",
  "absent",
  "excused",
];

const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  unmarked: "Unmarked",
  attended: "Attended",
  absent: "Absent",
  excused: "Excused",
};

type Props = {
  programId: string;
  readOnly?: boolean;
  canExport?: boolean;
};

export default function ProgramAttendanceTable({
  programId,
  readOnly = false,
  canExport = true,
}: Props) {
  const { show } = useNotification();
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [draft, setDraft] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAttendance(programId);
      setRows(data);
      setDraft(
        Object.fromEntries(
          data.map((r) => [r.userId, r.attendanceStatus]),
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load attendance");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    load();
  }, [load]);

  function setStatus(userId: string, status: AttendanceStatus) {
    setDraft((prev) => ({ ...prev, [userId]: status }));
  }

  function markAll(status: AttendanceStatus) {
    setDraft(
      Object.fromEntries(rows.map((r) => [r.userId, status])),
    );
  }

  const changed = rows.some((r) => draft[r.userId] !== r.attendanceStatus);

  async function handleSave() {
    const updates = rows
      .filter((r) => draft[r.userId] !== r.attendanceStatus)
      .map((r) => ({
        userId: r.userId,
        attendanceStatus: draft[r.userId],
      }));

    if (updates.length === 0) return;

    setSaving(true);
    try {
      await updateAttendance(programId, updates);
      show({ msg: "Attendance saved", type: "success", duration: 3000 });
      await load();
    } catch (err) {
      show({
        msg: err instanceof Error ? err.message : "Failed to save attendance",
        type: "error",
        closable: true,
        duration: null,
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <ListSkeleton rows={4} />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex items-center justify-between gap-2">
          <span>{error}</span>
          <Button type="button" size="sm" variant="outline" onClick={load}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No invitees yet.</p>
    );
  }

  const attendedCount = rows.filter(
    (r) => (draft[r.userId] ?? r.attendanceStatus) === "attended",
  ).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Attendance</p>
          <p className="text-xs text-muted-foreground">
            {attendedCount} of {rows.length} marked attended
          </p>
        </div>
        {!readOnly || canExport ? (
          <div className="flex flex-wrap gap-2">
            {!readOnly && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => markAll("attended")}
              >
                Mark all attended
              </Button>
            )}
            {canExport && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={async () => {
                  try {
                    await downloadAttendanceCsv(programId);
                    show({
                      msg: "CSV downloaded",
                      type: "success",
                      duration: 2000,
                    });
                  } catch (err) {
                    show({
                      msg:
                        err instanceof Error ? err.message : "Export failed",
                      type: "error",
                      closable: true,
                      duration: null,
                    });
                  }
                }}
              >
                Export CSV
              </Button>
            )}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col space-y-2">
        {rows.map((row) => (
          <div
            key={row._id}
            className="flex flex-col sm:flex-row sm:items-center gap-2 py-4 border-b"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {row.user?.fullName ?? "Unknown"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {row.user?.email}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {row.user?.role && (
                  <Badge variant="outline" className="text-xs">
                    {roleLabelShort(row.user.role)}
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs">
                  RSVP: {RSVP_STATUS_LABELS[row.rsvpStatus]}
                </Badge>
              </div>
            </div>
            {readOnly ? (
              <Badge variant="outline" className="w-fit shrink-0">
                {ATTENDANCE_LABELS[row.attendanceStatus]}
              </Badge>
            ) : (
              <Select
                value={draft[row.userId] ?? row.attendanceStatus}
                onValueChange={(v) =>
                  setStatus(row.userId, v as AttendanceStatus)
                }
              >
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ATTENDANCE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {ATTENDANCE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ))}
      </div>

      {!readOnly && changed && (
        <Button
          type="button"
          className="w-full"
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? "Saving…" : "Save attendance"}
        </Button>
      )}
    </div>
  );
}
