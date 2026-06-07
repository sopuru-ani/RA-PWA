"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { stickyAboveBottomNavClassName } from "@/lib/bottom-nav";

type Props = {
  onClick: () => void;
  disabled?: boolean;
};

export default function ReportIncidentStickyBar({ onClick, disabled }: Props) {
  return (
    <div
      className={cn(
        "md:hidden fixed inset-x-0 z-30 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-3 py-2",
        stickyAboveBottomNavClassName(),
      )}
    >
      <Button className="w-full text-white" onClick={onClick} disabled={disabled}>
        <Plus className="h-4 w-4" />
        Report incident
      </Button>
    </div>
  );
}
