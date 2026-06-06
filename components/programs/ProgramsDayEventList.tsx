"use client";

import { useRouter } from "next/navigation";
import { formatDate, formatTime } from "@/lib/formatters";
import type { CalendarEvent } from "@/types/programs";

type Props = {
  events: CalendarEvent[];
  detailPath: (programId: string) => string;
  emptyMessage?: string;
};

export default function ProgramsDayEventList({
  events,
  detailPath,
  emptyMessage = "No programs this day",
}: Props) {
  const router = useRouter();

  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground px-1 py-2">{emptyMessage}</p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {events.map((event) => (
        <button
          key={event.id}
          type="button"
          className="text-left rounded-md border p-3 hover:border-primary/40 transition-colors w-full"
          onClick={() => router.push(detailPath(event.id))}
        >
          <p className="font-semibold text-sm">{event.title}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDate(event.date)}
          </p>
          {event.startTime && (
            <p className="text-xs text-muted-foreground">
              {formatTime(event.startTime)}
              {event.endTime ? ` – ${formatTime(event.endTime)}` : ""}
            </p>
          )}
          {event.meta.requiredAttendance && (
            <p className="text-xs text-primary mt-1">Required</p>
          )}
          {event.meta.rsvpStatus && (
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">
              RSVP: {event.meta.rsvpStatus}
            </p>
          )}
        </button>
      ))}
    </div>
  );
}
