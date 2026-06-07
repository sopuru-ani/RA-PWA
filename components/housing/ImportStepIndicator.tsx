import { cn } from "@/lib/utils";

const STEPS = [
  { id: "drop", label: "Upload" },
  { id: "pick", label: "Sheet" },
  { id: "table", label: "Preview" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

type Props = {
  current: StepId;
  className?: string;
};

export default function ImportStepIndicator({ current, className }: Props) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <nav
      aria-label="Import progress"
      className={cn("flex items-center justify-center gap-2 px-3 py-2", className)}
    >
      {STEPS.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;

        return (
          <div key={step.id} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium",
                done || active
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {index + 1}
            </span>
            <span
              className={cn(
                "text-xs",
                active ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
            {index < STEPS.length - 1 ? (
              <span
                className={cn(
                  "h-px w-6 sm:w-10",
                  done ? "bg-primary" : "bg-border",
                )}
                aria-hidden
              />
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
