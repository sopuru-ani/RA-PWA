"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate } from "@/lib/formatters";
import ProgramsDayEventList from "@/components/programs/ProgramsDayEventList";
import type { CalendarEvent } from "@/types/programs";

type Props = {
  selectedDate: string;
  events: CalendarEvent[];
  detailPath: (programId: string) => string;
};

export default function ProgramsDayEventsPanel({
  selectedDate,
  events,
  detailPath,
}: Props) {
  return (
    <aside className="hidden md:flex md:w-[30%] md:shrink-0 md:flex-col md:border-l md:min-h-0 md:overflow-hidden">
      <div className="shrink-0 border-b px-4 py-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Events
        </p>
        <p className="text-sm font-semibold mt-0.5">
          {formatDate(selectedDate)}
        </p>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4">
          <ProgramsDayEventList events={events} detailPath={detailPath} />
        </div>
      </ScrollArea>
    </aside>
  );
}
