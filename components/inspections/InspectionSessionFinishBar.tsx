"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  completed: number;
  total: number;
  onFinish: () => void;
  loading?: boolean;
  className?: string;
};

export default function InspectionSessionFinishBar({
  completed,
  total,
  onFinish,
  loading = false,
  className,
}: Props) {
  const ready = total > 0 && completed >= total;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        className,
      )}
    >
      <p className="mb-2 text-center text-xs text-muted-foreground">
        {ready
          ? "All rooms checked — finish to close this walkthrough"
          : `${total - completed} room${total - completed === 1 ? "" : "s"} remaining`}
      </p>
      <Button
        className="w-full text-white"
        disabled={!ready || loading}
        onClick={onFinish}
      >
        {loading ? "Finishing…" : "Finish walkthrough"}
      </Button>
    </div>
  );
}
