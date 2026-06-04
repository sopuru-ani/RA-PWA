"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Walkthroughs from "@/components/RA/Inspections/Walkthroughs";
import { apiFetch } from "@/lib/api-client";
import { useGASession } from "@/context/GASessionContext";
import ListSkeleton from "@/components/housing/ListSkeleton";
import Empty from "@/components/RA/Empty";
import { ClipboardCheck } from "lucide-react";
import type { InspectionSession } from "@/db/roomcheck.model";

type InProgress = {
  section: string;
  inspectionSession: string;
  inspectionWeek?: string;
  roomCount: number;
};

export default function GAInspectionsPage() {
  const { community } = useGASession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [walkthroughs, setWalkthroughs] = useState<
    (InspectionSession & { section?: string; inspectedBy?: string })[]
  >([]);
  const [inProgress, setInProgress] = useState<InProgress[]>([]);
  const [section, setSection] = useState(community.sections[0] ?? "");

  useEffect(() => {
    async function load() {
      const res = await apiFetch("api/ga/inspections/walkthroughs", {
        method: "GET",
      });
      const data = await res.json();
      if (res.ok) {
        setWalkthroughs(data.walkthroughs ?? []);
        setInProgress(data.inProgress ?? []);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <ListSkeleton rows={5} />;

  return (
    <div className="flex flex-col h-full space-y-3 pb-4">
      <div className="mx-1">
        <h1 className="text-xl font-semibold">Inspections</h1>
        <p className="text-sm text-muted-foreground">{community.name}</p>
      </div>

      <div className="mx-1 flex flex-col gap-2">
        <Select value={section} onValueChange={setSection}>
          <SelectTrigger>
            <SelectValue placeholder="Section for new inspection" />
          </SelectTrigger>
          <SelectContent>
            {community.sections.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button asChild className="text-white w-full">
          <Link
            href={`/ga/inspectionSession?section=${encodeURIComponent(section)}`}
          >
            New inspection (section {section})
          </Link>
        </Button>
      </div>

      {inProgress.length > 0 ? (
        <div className="mx-1 space-y-2">
          <p className="text-sm font-medium">In progress</p>
          {inProgress.map((s) => (
            <Button
              key={`${s.section}-${s.inspectionSession}`}
              variant="outline"
              className="w-full justify-start"
              onClick={() =>
                router.push(
                  `/ga/inspectionSession?section=${encodeURIComponent(s.section)}&resume=1`,
                )
              }
            >
              Resume {s.section} ({s.roomCount} rooms started)
            </Button>
          ))}
        </div>
      ) : null}

      {walkthroughs.length === 0 ? (
        <Empty
          message="No walkthroughs yet"
          description="Completed inspections will appear here."
          icon={<ClipboardCheck className="h-6 w-6" />}
        />
      ) : (
        <ScrollArea className="flex-1 mx-1">
          <div className="flex flex-col gap-1 pb-4">
            {walkthroughs.map((w) => (
              <div key={`${w.inspectionSession}-${w.section}`}>
                <p className="text-xs text-muted-foreground px-1 mb-1">
                  Section {w.section}
                  {w.inspectedBy ? ` · ${w.inspectedBy}` : ""}
                </p>
                <Walkthroughs
                  w={w}
                  walkthroughPath="api/ga/inspections/walkthrough"
                />
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
