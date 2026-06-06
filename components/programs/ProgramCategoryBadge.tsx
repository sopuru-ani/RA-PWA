import { Badge } from "@/components/ui/badge";
import { PROGRAM_CATEGORY_LABELS } from "@/lib/program-labels";
import type { ProgramCategory } from "@/types/programs";

export default function ProgramCategoryBadge({
  category,
}: {
  category: ProgramCategory;
}) {
  return (
    <Badge variant="outline">{PROGRAM_CATEGORY_LABELS[category]}</Badge>
  );
}
