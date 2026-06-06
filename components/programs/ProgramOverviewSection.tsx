"use client";

import Link from "next/link";
import { CalendarDays, ClipboardList, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { calendarPath, programsBasePath } from "@/lib/program-labels";
import type { ProgramStats } from "@/types/programs";

type Props = {
  role: string;
  stats?: ProgramStats | null;
};

export default function ProgramOverviewSection({ role, stats }: Props) {
  if (!stats) return null;

  const base = programsBasePath(role);
  const cal = calendarPath(role);
  const hasAlerts =
    stats.pendingRsvpCount > 0 ||
    stats.requiredCount > 0 ||
    (stats.pendingApprovalCount ?? 0) > 0 ||
    stats.draftOrPendingOwnCount > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Programs</p>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={cal}>
              <CalendarDays className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={base}>
              <ClipboardList className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{stats.upcomingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending RSVP</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{stats.pendingRsvpCount}</p>
          </CardContent>
        </Card>
        {stats.requiredCount > 0 && (
          <Card className="col-span-2 border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-primary">
                Required attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{stats.requiredCount}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {hasAlerts && (
        <div className="space-y-2">
          {(stats.pendingApprovalCount ?? 0) > 0 && role === "Admin" && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between gap-2">
                <span>
                  {stats.pendingApprovalCount} program
                  {stats.pendingApprovalCount === 1 ? "" : "s"} awaiting approval
                </span>
                <Button asChild size="sm" variant="outline" className="shrink-0">
                  <Link href={`${base}?tab=pending`}>Review</Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {stats.pendingRsvpCount > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You have {stats.pendingRsvpCount} pending RSVP
                {stats.pendingRsvpCount === 1 ? "" : "s"}.
              </AlertDescription>
            </Alert>
          )}
          {stats.draftOrPendingOwnCount > 0 && role !== "Admin" && (
            <Alert>
              <AlertDescription>
                {stats.draftOrPendingOwnCount} of your programs need action
                (draft, pending approval, or rejected).
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <Button asChild size="sm" className="w-full text-white">
        <Link href={`${base}/new`}>Create a program</Link>
      </Button>
    </div>
  );
}
