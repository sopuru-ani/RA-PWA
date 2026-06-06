"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  fetchProgramConflicts,
  splitIsoToLocal,
  type ProgramConflict,
} from "@/lib/programs-api";
import { formatDate } from "@/lib/formatters";

type Props = {
  startDate: string;
  endDate: string;
  excludeProgramId?: string;
};

export default function ProgramConflictAlert({
  startDate,
  endDate,
  excludeProgramId,
}: Props) {
  const [conflicts, setConflicts] = useState<ProgramConflict[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!startDate || !endDate) {
      setConflicts([]);
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      setConflicts([]);
      return;
    }

    let mounted = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await fetchProgramConflicts(
          start.toISOString(),
          end.toISOString(),
          excludeProgramId,
        );
        if (mounted) setConflicts(data);
      } catch {
        if (mounted) setConflicts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }, 400);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [startDate, endDate, excludeProgramId]);

  if (loading || conflicts.length === 0) {
    return null;
  }

  return (
    <Alert variant="default" className="border-amber-500/50 bg-amber-500/5">
      <AlertTitle className="text-sm">Schedule conflict</AlertTitle>
      <AlertDescription className="text-sm space-y-1">
        <p>You already have {conflicts.length} overlapping program(s):</p>
        <ul className="list-disc pl-4 space-y-0.5">
          {conflicts.map((c) => {
            const d = splitIsoToLocal(c.startDate);
            return (
              <li key={c.programId}>
                {c.title} — {formatDate(d.date)}
              </li>
            );
          })}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
