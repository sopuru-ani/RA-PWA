import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Props = {
  resolved?: boolean;
  className?: string;
};

export default function IncidentStatusBadge({ resolved = false, className }: Props) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "shrink-0 border-transparent font-medium",
        resolved
          ? "bg-green-500/10 text-green-700 dark:bg-green-900/10 dark:text-green-400"
          : "bg-red-500/10 text-red-700 dark:bg-red-900/10 dark:text-red-400",
        className,
      )}
    >
      {resolved ? "Resolved" : "Open"}
    </Badge>
  );
}
