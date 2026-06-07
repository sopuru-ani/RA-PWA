"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type RoomSaveStatus = "idle" | "saving" | "saved" | "error";

type Props = {
  status: RoomSaveStatus;
  disabled?: boolean;
  hidden?: boolean;
  onClick: () => void;
};

export default function RoomSaveButton({
  status,
  disabled,
  hidden,
  onClick,
}: Props) {
  const label =
    status === "saving"
      ? "Saving…"
      : status === "saved"
        ? "Saved"
        : status === "error"
          ? "Retry save"
          : "Mark checked";

  return (
    <Button
      type="button"
      className={cn("text-white hover:opacity-90", hidden && "hidden")}
      disabled={disabled || status === "saving"}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}
