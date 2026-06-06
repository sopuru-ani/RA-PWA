import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import ProgramStatusBadge from "@/components/programs/ProgramStatusBadge";
import ProgramCategoryBadge from "@/components/programs/ProgramCategoryBadge";
import { formatDate, formatTime } from "@/lib/formatters";
import { splitIsoToLocal } from "@/lib/programs-api";
import type { Program } from "@/types/programs";

type Props = {
  program: Program;
  href: string;
  showCreator?: boolean;
};

export default function ProgramCard({ program, href, showCreator }: Props) {
  const start = splitIsoToLocal(program.startDate);
  const end = splitIsoToLocal(program.endDate);

  return (
    <Link href={href}>
      <Card className="hover:border-primary/30 transition-colors">
        <CardContent className="py-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-sm leading-snug">{program.title}</p>
            <ProgramStatusBadge status={program.status} />
          </div>
          <div className="flex flex-wrap gap-2">
            <ProgramCategoryBadge category={program.category} />
            {program.requiredAttendance && (
              <span className="text-xs text-primary font-medium">
                Required
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>
              {formatDate(start.date)}
              {start.time ? ` · ${formatTime(start.time)}` : ""}
              {end.time && end.time !== start.time
                ? ` – ${formatTime(end.time)}`
                : ""}
            </span>
          </div>
          {program.location && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>{program.location}</span>
            </div>
          )}
          {showCreator && (
            <p className="text-xs text-muted-foreground">
              Created by {program.createdByRole}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
