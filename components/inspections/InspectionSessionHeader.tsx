"use client";

import { Progress } from "@/components/ui/progress";

type Props = {
  completed: number;
  total: number;
};

export default function InspectionSessionHeader({ completed, total }: Props) {
  const pct = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="sticky top-0 z-20 shrink-0 border-b bg-background/95 px-3 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-base font-semibold">Room checks</h1>
          <p className="text-xs text-muted-foreground">
            {completed} of {total} rooms complete · progress saves to your
            walkthrough on this device
          </p>
        </div>
        <span className="shrink-0 text-sm font-medium tabular-nums">
          {completed}/{total}
        </span>
      </div>
      <Progress value={pct} className="mt-2 h-1.5" />
    </div>
  );
}
