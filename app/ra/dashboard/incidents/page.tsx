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
import { useResidents } from "@/context/RAResidentProvider";
import Empty from "@/components/RA/Empty";
import PageHeader from "@/components/housing/PageHeader";
import { stickyActionBarClearanceClassName } from "@/lib/bottom-nav";
import { cn } from "@/lib/utils";

function Page() {
  const {
    community,
    user,
    rooms,
    incidents,
    refreshIncidents,
  } = useResidents();

  const [dropdown, setDropdown] = useState("All");
  const [createOpen, setCreateOpen] = useState(false);
  const filteredIncidents =
    dropdown === "All"
      ? incidents
      : incidents.filter((incident) => incident.type === dropdown);
  const isEmpty = filteredIncidents.length < 1;

  return (
    <>
      <div className={cn("flex flex-col h-full mx-3", stickyActionBarClearanceClassName())}>
        <PageHeader
          title="Incidents"
          subtitle="Reports in your section and community"
        />

        <ScrollArea className="overflow-x-auto mb-2">
          <div className="flex gap-2 overflow-x-auto whitespace-nowrap no-scrollbar">
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

        {isEmpty ? (
          <Empty
            message="No incidents reported"
            description="You're all caught up. Tap Report incident below to file a new report."
            icon={<ShieldAlert className="h-6 w-6" />}
          />
        ) : (
          <ScrollArea className="flex-1 overflow-y-auto rounded-xs">
            <Accordion type="single" collapsible className="flex flex-col gap-1 pb-1">
              {filteredIncidents.map((incident) => {
                const id = String(incident._id);
                return (
                  <AccordionItem
                    key={id}
                    value={id}
                    className="rounded-lg border bg-card px-3 py-2 md:rounded-none md:border-0 md:border-b md:shadow-none"
                  >
                    <AccordionTrigger className="hover:no-underline py-2 flex-row-reverse">
                      <div className="flex w-full items-start justify-between gap-4 text-left">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground">
                            {incident.type}
                          </span>
                          <span className="font-medium leading-tight">
                            {incident.title}
                          </span>
                        </div>
                        <IncidentStatusBadge resolved={incident.resolved} />
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="relative pb-10 mt-2 space-y-2 text-sm text-muted-foreground">
                      {incident.description ? (
                        <p>{incident.description}</p>
                      ) : null}
                      {incident.reporter ? (
                        <p>Reporter: {incident.reporter}</p>
                      ) : null}
                      <div>
                        <EditIncidentPopUp
                          communityInfo={community}
                          user={user}
                          rooms={rooms}
                          onSuccess={() => refreshIncidents()}
                          incident={incident}
                        />
                        <DeleteIncidentPopUp
                          incidentId={incident._id}
                          onSuccess={() => refreshIncidents()}
                        />
                      </div>
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
        communityInfo={community}
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

export default Page;
