"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import DropDown from "@/components/RA/Incidents/DropDown";
import CreateIncidentPopUp from "@/components/RA/Incidents/CreateIncidentPopUp";
import EditIncidentPopUp from "@/components/RA/Incidents/EditIncidentPopUp";
import DeleteIncidentPopUp from "@/components/RA/Incidents/DeleteIncidentPopUp";
import { useGAWorkspace } from "@/context/GAWorkspaceContext";
import Empty from "@/components/RA/Empty";
import { ShieldAlert } from "lucide-react";

export default function GAIncidentsPage() {
  const { communityInfo, user, rooms, incidents, refreshIncidents } =
    useGAWorkspace();
  const [dropdown, setDropdown] = useState("All");

  const filteredIncidents =
    dropdown === "All"
      ? incidents
      : incidents.filter((incident) => incident.type === dropdown);

  return (
    <div className="flex flex-col h-full mx-3">
      <div className="mb-2">
        <h1 className="text-xl font-semibold mx-1">Incidents</h1>
        <p className="text-sm text-muted-foreground mx-1">
          All sections in your community
        </p>
      </div>
      <ScrollArea className="overflow-x-auto mb-2 mx-1">
        <div className="flex gap-2 whitespace-nowrap">
          <DropDown dropdown={dropdown} setDropdown={setDropdown} />
          <CreateIncidentPopUp
            communityInfo={communityInfo}
            user={user}
            rooms={rooms}
            onSuccess={() => refreshIncidents()}
          />
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {filteredIncidents.length === 0 ? (
        <Empty
          message="No incidents reported"
          description="Nothing in this community yet."
          icon={<ShieldAlert className="h-6 w-6" />}
        />
      ) : (
        <ScrollArea className="flex-1 overflow-y-auto rounded-xs pr-2">
          <div className="flex flex-col gap-1 pb-4">
            {filteredIncidents.map((incident, i) => (
              <Card key={i} className="px-3 py-2 md:border-0 md:border-b md:shadow-none md:rounded-none">
                <Accordion type="single" collapsible>
                  <AccordionItem value="item-1" className="border-none">
                    <AccordionTrigger className="hover:no-underline py-2">
                      <div className="flex w-full justify-between gap-2 text-left">
                        <div>
                          <span className="text-xs text-muted-foreground">
                            {incident.type}
                            {incident.section ? ` · ${incident.section}` : ""}
                          </span>
                          <p className="font-medium">{incident.title}</p>
                        </div>
                        <span className={"text-xs px-2 py-0.5 h-fit shrink-0 rounded-full " +(incident.resolved ? "bg-green-500/10 text-green-700 dark:bg-green-900/10 dark:text-green-400" : "bg-red-500/10 text-red-700 dark:bg-red-900/10 dark:text-red-400")}>
                          {incident.resolved ? "Resolved" : "Open"}
                        </span>
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
                </Accordion>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
