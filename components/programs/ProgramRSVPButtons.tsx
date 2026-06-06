"use client";

import { Button } from "@/components/ui/button";
import type { RsvpStatus } from "@/types/programs";

type Props = {
  current?: RsvpStatus;
  loading?: boolean;
  onRsvp: (status: RsvpStatus) => void;
};

export default function ProgramRSVPButtons({
  current,
  loading,
  onRsvp,
}: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant={current === "accepted" ? "default" : "outline"}
        disabled={loading}
        onClick={() => onRsvp("accepted")}
        className={current === "accepted" ? "text-white" : ""}
      >
        Accept
      </Button>
      <Button
        size="sm"
        variant={current === "tentative" ? "default" : "outline"}
        disabled={loading}
        onClick={() => onRsvp("tentative")}
        className={current === "tentative" ? "text-white" : ""}
      >
        Tentative
      </Button>
      <Button
        size="sm"
        variant={current === "declined" ? "destructive" : "outline"}
        disabled={loading}
        onClick={() => onRsvp("declined")}
      >
        Decline
      </Button>
    </div>
  );
}
