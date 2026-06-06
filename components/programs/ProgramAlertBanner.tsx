"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ProgramStats } from "@/types/programs";

type Props = {
  stats?: ProgramStats | null;
  programsHref: string;
  calendarHref: string;
};

export default function ProgramAlertBanner({
  stats,
  programsHref,
  calendarHref,
}: Props) {
  if (!stats) return null;

  const messages: string[] = [];
  if (stats.pendingRsvpCount > 0) {
    messages.push(
      `${stats.pendingRsvpCount} pending RSVP${stats.pendingRsvpCount === 1 ? "" : "s"}`,
    );
  }
  if (stats.requiredCount > 0) {
    messages.push(
      `${stats.requiredCount} required program${stats.requiredCount === 1 ? "" : "s"} upcoming`,
    );
  }
  if (stats.draftOrPendingOwnCount > 0) {
    messages.push(
      `${stats.draftOrPendingOwnCount} program${stats.draftOrPendingOwnCount === 1 ? "" : "s"} need your action`,
    );
  }

  if (messages.length === 0) return null;

  return (
    <Alert className="mx-3 mt-2">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-2">
        <span>{messages.join(" · ")}</span>
        <div className="flex gap-2 shrink-0">
          <Button asChild size="sm" variant="outline">
            <Link href={programsHref}>Programs</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={calendarHref}>Calendar</Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
