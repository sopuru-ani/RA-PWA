"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProgramCard from "@/components/programs/ProgramCard";
import ListSkeleton from "@/components/housing/ListSkeleton";
import Empty from "@/components/RA/Empty";
import PageHeader from "@/components/housing/PageHeader";
import { useNotification } from "@/context/notification-context";
import {
  fetchMonitoringPrograms,
  fetchPendingPrograms,
  fetchPrograms,
  fetchProgramStats,
  sendProgramReminders,
} from "@/lib/programs-api";
import { calendarPath } from "@/lib/program-labels";
import type { Program, ProgramStats } from "@/types/programs";

type ListMode = "mine" | "monitoring" | "pending";

type Props = {
  role: string;
  basePath: string;
  modes?: ListMode[];
  showCreate?: boolean;
  showCalendarLink?: boolean;
};

export default function ProgramsListView({
  role,
  basePath,
  modes = ["mine"],
  showCreate = true,
  showCalendarLink = true,
}: Props) {
  const { show } = useNotification();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialMode: ListMode =
    tabParam === "pending" && modes.includes("pending")
      ? "pending"
      : tabParam === "monitoring" && modes.includes("monitoring")
        ? "monitoring"
        : modes[0];
  const [mode, setMode] = useState<ListMode>(initialMode);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [stats, setStats] = useState<ProgramStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [reminderLoading, setReminderLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, programStats] = await Promise.all([
        mode === "monitoring"
          ? fetchMonitoringPrograms()
          : mode === "pending"
            ? fetchPendingPrograms()
            : fetchPrograms(),
        fetchProgramStats().catch(() => null),
      ]);
      setPrograms(list);
      setStats(programStats);
    } catch (err) {
      show({
        msg: err instanceof Error ? err.message : "Failed to load programs",
        type: "error",
        closable: true,
        duration: null,
      });
    } finally {
      setLoading(false);
    }
  }, [mode, show]);

  useEffect(() => {
    load();
  }, [load]);

  const modeLabels: Record<ListMode, string> = {
    mine: "My programs",
    monitoring: "Oversight",
    pending: "Pending approval",
  };

  return (
    <div className="space-y-4 pb-4 mx-3">
      <div className="flex items-start justify-between gap-2">
        <PageHeader
          title="Programs"
          subtitle="Events, meetings, and trainings"
          className="mb-0 min-w-0"
        />
        <div className="flex shrink-0 gap-2">
          {showCalendarLink && (
            <Button asChild size="sm" variant="outline">
              <Link href={calendarPath(role)} aria-label="Open calendar">
                <CalendarDays className="h-4 w-4" />
              </Link>
            </Button>
          )}
          {showCreate && (
            <Button asChild size="sm" className="text-white">
              <Link href={`${basePath}/new`} aria-label="Create program">
                <Plus className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {role === "Admin" && (
        <Button
          size="sm"
          variant="outline"
          disabled={reminderLoading}
          onClick={async () => {
            setReminderLoading(true);
            try {
              const result = await sendProgramReminders();
              show({
                msg: `Reminders: ${result.sent} sent, ${result.skipped} skipped`,
                type: "success",
                duration: 4000,
              });
            } catch (err) {
              show({
                msg:
                  err instanceof Error ? err.message : "Reminder job failed",
                type: "error",
                closable: true,
                duration: null,
              });
            } finally {
              setReminderLoading(false);
            }
          }}
        >
          {reminderLoading ? "Sending…" : "Send 24h reminders"}
        </Button>
      )}

      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Upcoming</p>
            <p className="text-2xl font-semibold">{stats.upcomingCount}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Pending RSVP</p>
            <p className="text-2xl font-semibold">{stats.pendingRsvpCount}</p>
          </div>
          {stats.pendingApprovalCount !== undefined &&
            stats.pendingApprovalCount > 0 && (
              <div className="rounded-lg border border-primary/30 p-3 col-span-2">
                <p className="text-xs text-muted-foreground">
                  Awaiting your approval
                </p>
                <p className="text-2xl font-semibold">
                  {stats.pendingApprovalCount}
                </p>
              </div>
            )}
        </div>
      )}

      {modes.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {modes.map((m) => (
            <Button
              key={m}
              size="sm"
              variant={mode === m ? "default" : "outline"}
              onClick={() => setMode(m)}
            >
              {modeLabels[m]}
            </Button>
          ))}
        </div>
      )}

      {loading ? (
        <ListSkeleton rows={4} />
      ) : programs.length === 0 ? (
        <Empty
          message="No programs yet"
          description={
            showCreate
              ? "Create a program or check the calendar for upcoming events."
              : "Programs in your scope will appear here."
          }
          icon={<CalendarDays className="h-6 w-6" />}
        />
      ) : (
        <div className="flex flex-col space-y-2">
          {programs.map((program) => (
            <ProgramCard
              key={program._id}
              program={program}
              href={`${basePath}/${program._id}`}
              showCreator={mode === "monitoring" || mode === "pending"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
