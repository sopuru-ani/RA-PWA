"use client";

import { useState } from "react";
import { Plus, ShieldAlert } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import DropDown from "@/components/RA/Incidents/DropDown";
import CreateIncidentPopUp from "@/components/RA/Incidents/CreateIncidentPopUp";
import EditIncidentPopUp from "@/components/RA/Incidents/EditIncidentPopUp";
import DeleteIncidentPopUp from "@/components/RA/Incidents/DeleteIncidentPopUp";
import IncidentStatusBadge from "@/components/RA/Incidents/IncidentStatusBadge";
import ReportIncidentStickyBar from "@/components/RA/Incidents/ReportIncidentStickyBar";
import PageHeader from "@/components/housing/PageHeader";
import Empty from "@/components/RA/Empty";
import { useGAWorkspace } from "@/context/GAWorkspaceContext";
import { stickyActionBarClearanceClassName } from "@/lib/bottom-nav";
import { cn } from "@/lib/utils";

export default function GAIncidentsPage() {
  const { communityInfo, user, rooms, incidents, refreshIncidents } =
    useGAWorkspace();
  const [dropdown, setDropdown] = useState("All");
  const [createOpen, setCreateOpen] = useState(false);

  const filteredIncidents =
    dropdown === "All"
      ? incidents
      : incidents.filter((incident) => incident.type === dropdown);

  return (
    <>
      <div
        className={cn(
          "flex flex-col h-full mx-3",
          stickyActionBarClearanceClassName(),
        )}
      >
        <PageHeader
          title="Incidents"
          subtitle="All sections in your community"
        />

        <ScrollArea className="overflow-x-auto mb-2">
          <div className="flex gap-2 whitespace-nowrap">
            <DropDown dropdown={dropdown} setDropdown={setDropdown} />
            <Button
              className="hidden md:inline-flex text-white"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Create incident
            </Button>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {filteredIncidents.length === 0 ? (
          <Empty
            message="No incidents reported"
            description="Nothing in this community yet. Tap Report incident below to file one."
            icon={<ShieldAlert className="h-6 w-6" />}
          />
        ) : (
          <ScrollArea className="flex-1 overflow-y-auto rounded-xs pr-2">
            <Accordion
              type="single"
              collapsible
              className="flex flex-col gap-1 pb-1"
            >
              {filteredIncidents.map((incident) => {
                const id = String(incident._id);
                return (
                  <AccordionItem
                    key={id}
                    value={id}
                    className="rounded-lg border bg-card px-3 py-2 md:rounded-none md:border-0 md:border-b md:shadow-none"
                  >
                    <AccordionTrigger className="hover:no-underline py-2">
                      <div className="flex w-full justify-between gap-2 text-left">
                        <div>
                          <span className="text-xs text-muted-foreground">
                            {incident.type}
                            {incident.section ? ` · ${incident.section}` : ""}
                          </span>
                          <p className="font-medium">{incident.title}</p>
                        </div>
                        <IncidentStatusBadge resolved={incident.resolved} />
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 text-sm">
                      <p>{incident.description}</p>
                      <p className="text-muted-foreground">
                        Reporter: {incident.reporter}
                      </p>
                      <EditIncidentPopUp
                        communityInfo={communityInfo}
                        user={user}
                        rooms={rooms}
                        incident={incident}
                        onSuccess={() => refreshIncidents()}
                      />
                      <DeleteIncidentPopUp
                        incidentId={incident._id}
                        onSuccess={() => refreshIncidents()}
                      />
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </ScrollArea>
        )}
      </div>

      <ReportIncidentStickyBar onClick={() => setCreateOpen(true)} />

      <CreateIncidentPopUp
        communityInfo={communityInfo}
        user={user}
        rooms={rooms}
        onSuccess={() => refreshIncidents()}
        open={createOpen}
        onOpenChange={setCreateOpen}
        hideTrigger
      />
    </>
  );
}
