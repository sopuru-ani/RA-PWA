import { Badge } from "@/components/ui/badge";
import { PROGRAM_STATUS_LABELS } from "@/lib/program-labels";
import type { ProgramStatus } from "@/types/programs";

const VARIANT: Record<
  ProgramStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "secondary",
  pending_approval: "outline",
  published: "default",
  rejected: "destructive",
  cancelled: "destructive",
};

export default function ProgramStatusBadge({
  status,
}: {
  status: ProgramStatus;
}) {
  return (
    <Badge variant={VARIANT[status]}>{PROGRAM_STATUS_LABELS[status]}</Badge>
  );
}
