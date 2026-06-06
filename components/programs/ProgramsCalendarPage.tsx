"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProgramsCalendar from "@/components/programs/ProgramsCalendar";

type Props = {
  detailPath: (programId: string) => string;
  programsHref: string;
  /** RA uses full viewport without role dashboard shell */
  standalone?: boolean;
};

export default function ProgramsCalendarPage({
  detailPath,
  programsHref,
  standalone = false,
}: Props) {
  if (standalone) {
    return (
      <div className="flex h-dvh flex-col overflow-hidden bg-background">
        <header className="shrink-0 flex items-center gap-2 border-b px-3 py-3">
          <Link
            href={programsHref}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Programs
          </Link>
          <span className="text-sm font-medium ml-1">Calendar</span>
        </header>
        <div className="flex-1 min-h-0 overflow-hidden">
          <ProgramsCalendar detailPath={detailPath} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <header className="shrink-0 flex items-center gap-2 border-b px-3 py-2 bg-background">
        <Link
          href={programsHref}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Programs
        </Link>
        <span className="text-sm font-medium">Calendar</span>
      </header>
      <div className="flex-1 min-h-0 overflow-hidden">
        <ProgramsCalendar detailPath={detailPath} />
      </div>
    </div>
  );
}
