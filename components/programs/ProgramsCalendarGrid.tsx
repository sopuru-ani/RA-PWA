"use client";

import Calendar from "tony-calendar";
import "tony-calendar/dist/tony-calendar.css";
import "@/components/programs/programs-calendar-theme.css";
import { Button } from "@/components/ui/button";
import type { CalendarEvent as DomusCalendarEvent } from "@/types/programs";

type Props = {
  view: "month" | "week";
  onViewChange: (view: "month" | "week") => void;
  events: DomusCalendarEvent[];
  onDateSelect: (date: string) => void;
  onEventClick: (eventId: string) => void;
  onMoreClick: (date: string, events: DomusCalendarEvent[]) => void;
};

export default function ProgramsCalendarGrid({
  view,
  onViewChange,
  events,
  onDateSelect,
  onEventClick,
  onMoreClick,
}: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-end gap-2 border-b px-3 py-2 md:justify-between">
        <p className="hidden md:block text-sm font-medium">Calendar</p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onViewChange(view === "month" ? "week" : "month")}
        >
          {view === "month" ? "Week view" : "Month view"}
        </Button>
      </div>
      <div className="domus-tony-calendar relative flex-1 min-h-0 w-full overflow-hidden p-1 md:p-2">
        <div className="absolute inset-2 md:inset-3 min-h-0">
          <Calendar
          view={view}
          events={events}
          defaultDate={undefined}
          onDateSelect={onDateSelect}
          onEventClick={(event) => onEventClick(event.id)}
          onMoreClick={(date, dayEvents) => onMoreClick(date, dayEvents as DomusCalendarEvent[])}
        />
        </div>
      </div>
    </div>
  );
}
