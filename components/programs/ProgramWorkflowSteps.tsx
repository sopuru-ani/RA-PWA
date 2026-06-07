import { cn } from "@/lib/utils";
import type { ProgramStatus } from "@/types/programs";

const STEPS = [
  { id: "draft", label: "Draft" },
  { id: "pending_approval", label: "Review" },
  { id: "published", label: "Published" },
] as const;

function stepIndex(status: ProgramStatus): number {
  if (status === "pending_approval") return 1;
  if (status === "published" || status === "cancelled") return 2;
  return 0;
}

type Props = {
  status: ProgramStatus;
};

export default function ProgramWorkflowSteps({ status }: Props) {
  if (status === "cancelled") {
    return (
      <p className="text-sm text-muted-foreground">This program was cancelled.</p>
    );
  }

  const current = stepIndex(status);
  const rejected = status === "rejected";

  return (
    <ol className="flex items-center gap-1 text-xs sm:text-sm">
      {STEPS.map((step, index) => {
        const done = index < current || (index === 0 && rejected);
        const active =
          index === current ||
          (rejected && index === 0) ||
          (status === "draft" && index === 0);

        return (
          <li key={step.id} className="flex min-w-0 flex-1 items-center gap-1">
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium",
                done || active
                  ? "border-primary bg-primary text-white"
                  : "border-muted-foreground/30 text-muted-foreground",
                rejected && index === 0 && "border-destructive bg-destructive text-white",
              )}
            >
              {index + 1}
            </span>
            <span
              className={cn(
                "truncate",
                active || done ? "font-medium text-foreground" : "text-muted-foreground",
                rejected && index === 0 && "text-destructive",
              )}
            >
              {step.label}
              {rejected && index === 0 ? " (rejected)" : ""}
            </span>
            {index < STEPS.length - 1 ? (
              <span
                className={cn(
                  "mx-0.5 h-px min-w-2 flex-1",
                  index < current ? "bg-primary" : "bg-border",
                )}
                aria-hidden
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
