"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatDate } from "@/lib/formatters";
import ProgramsDayEventList from "@/components/programs/ProgramsDayEventList";
import type { CalendarEvent } from "@/types/programs";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string;
  events: CalendarEvent[];
  detailPath: (programId: string) => string;
};

export default function ProgramsDayEventsSheet({
  open,
  onOpenChange,
  selectedDate,
  events,
  detailPath,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="md:hidden">
        <SheetHeader>
          <SheetTitle>{formatDate(selectedDate)}</SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto flex-1 px-4 pb-6 max-h-[70dvh]">
          <ProgramsDayEventList events={events} detailPath={detailPath} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
