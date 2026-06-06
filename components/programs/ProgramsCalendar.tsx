"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ProgramsCalendarGrid from "@/components/programs/ProgramsCalendarGrid";
import ProgramsDayEventsPanel from "@/components/programs/ProgramsDayEventsPanel";
import ProgramsDayEventsSheet from "@/components/programs/ProgramsDayEventsSheet";
import ListSkeleton from "@/components/housing/ListSkeleton";
import { calendarFetchRange, fetchCalendarEvents } from "@/lib/programs-api";
import { eventsForDate, todayDateString } from "@/lib/calendar-date";
import type { CalendarEvent as DomusCalendarEvent } from "@/types/programs";

type Props = {
  detailPath: (programId: string) => string;
};

export default function ProgramsCalendar({ detailPath }: Props) {
  const router = useRouter();
  const [view, setView] = useState<"month" | "week">("month");
  const [events, setEvents] = useState<DomusCalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayDateString);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dayEvents = useMemo(
    () => eventsForDate(events, selectedDate),
    [events, selectedDate],
  );

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { from, to } = calendarFetchRange();
      const data = await fetchCalendarEvents(from, to);
      setEvents(data);
      setSelectedDate((current) => current || todayDateString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load calendar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  function handleDateSelect(date: string) {
    setSelectedDate(date);
    setSheetOpen(true);
  }

  function handleMoreClick(date: string, list: DomusCalendarEvent[]) {
    setSelectedDate(date);
    if (list.length > 0) {
      setSheetOpen(true);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col md:flex-row overflow-hidden">
      <div className="flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden">
        {error && (
          <Alert variant="destructive" className="m-2 shrink-0">
            <AlertDescription className="flex items-center justify-between gap-2">
              <span>{error}</span>
              <Button size="sm" variant="outline" onClick={loadEvents}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex-1 p-4">
            <ListSkeleton rows={8} />
          </div>
        ) : (
          <ProgramsCalendarGrid
            view={view}
            onViewChange={setView}
            events={events}
            onDateSelect={handleDateSelect}
            onEventClick={(id) => router.push(detailPath(id))}
            onMoreClick={handleMoreClick}
          />
        )}
      </div>

      {!loading && (
        <ProgramsDayEventsPanel
          selectedDate={selectedDate}
          events={dayEvents}
          detailPath={detailPath}
        />
      )}

      <ProgramsDayEventsSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        selectedDate={selectedDate}
        events={dayEvents}
        detailPath={detailPath}
      />
    </div>
  );
}
