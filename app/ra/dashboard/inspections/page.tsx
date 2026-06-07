"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClipboardCheck } from "lucide-react";
import Link from "next/link";

import { useResidents } from "@/context/RAResidentProvider";
import { InspectionSession } from "@/db/roomcheck.model";
import Walkthroughs from "@/components/RA/Inspections/Walkthroughs";
import Empty from "@/components/RA/Empty";

function page() {
  const {
    sessionId,
    walkthroughs,
  }: { sessionId: string | null; walkthroughs: InspectionSession[] } =
    useResidents();

  const isEmpty = walkthroughs.length < 1;
  const isResumeSession = Boolean(sessionId);

  return (
    <div className="flex flex-col h-full">
      <div className="mb-2 mx-3">
        <Link href="/ra/inspectionSession">
          <Button
            className={
              isResumeSession
                ? "bg-orange-500 text-primary-foreground hover:bg-orange-500/90"
                : undefined
            }
          >
            {isResumeSession
              ? "Resume Inspection Session"
              : "New Inspection Session"}
          </Button>
        </Link>
      </div>
      {isEmpty ? (
        <Empty
          message="No walkthroughs yet"
          description="Once inspections are completed, they’ll appear here."
          icon={<ClipboardCheck className="h-6 w-6" />}
        />
      ) : (
        <ScrollArea className="flex-1 overflow-y-auto rounded-xs">
          <div className="flex flex-col gap-1 mx-3 pb-1">
            {walkthroughs.map((w) => (
              <Walkthroughs key={w.inspectionSession} w={w} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

export default page;
