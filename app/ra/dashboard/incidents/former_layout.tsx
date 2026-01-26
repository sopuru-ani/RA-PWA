"use client";
import Link from "next/link";

import { useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import DropDown from "@/components/RA/Incidents/DropDown";

import CreateIncidentPopUp from "@/components/RA/Incidents/CreateIncidentPopUp";
import { useResidents } from "@/context/RAResidentProvider";

import { Plus } from "lucide-react";
import { CommunityLean } from "@/db/community.models";
import { UserType } from "@/db/user.model";
import { RoomLean } from "@/db/room.model";
import { IncidentLean } from "@/db/incident.model";

function page({ children }: { children: ReactNode }) {
  const {
    community,
    user,
    rooms,
  }: {
    community: CommunityLean[];
    user: UserType;
    rooms: RoomLean[];
  } = useResidents();
  const router = useRouter();
  const items = Array.from({ length: 70 });
  const [selected, setSelected] = useState("Section");
  const [dropdown, setDropdown] = useState("All");
  return (
    <>
      <div className="flex flex-col h-full">
        <ScrollArea className="overflow-x-auto mb-2 mx-3">
          {/* <div className="relative"> */}
          {/* <div className="absolute left-0 top-0 h-full w-8 bg-linear-to-r md:bg-none from-background to-transparent pointer-events-none" /> */}
          {/* <div className="absolute right-0 top-0 h-full w-8 bg-linear-to-l md:bg-none from-background to-transparent pointer-events-none" /> */}

          <div className="flex gap-2 overflow-x-auto whitespace-nowrap no-scrollbar">
            {/* <ToggleGroup
              className=""
              type="single"
              variant="outline"
              value={selected}
              onValueChange={(value) => value && setSelected(value)}
            >
              <ToggleGroupItem
                value="Section"
                className="data-[state=on]:bg-primary data-[state=on]:text-white"
              >
                Section
              </ToggleGroupItem>
              <ToggleGroupItem
                value="Community"
                className="data-[state=on]:bg-primary data-[state=on]:text-white"
              >
                Community
              </ToggleGroupItem>
            </ToggleGroup> */}
            <DropDown dropdown={dropdown} setDropdown={setDropdown} />
            {/* <Link href="/ra/createIncidents">
              <Button className="text-white">
                <Plus /> Create Incident
              </Button>
            </Link> */}
            <CreateIncidentPopUp
              communityInfo={community}
              user={user}
              rooms={rooms}
              onSuccess={() => window.location.reload()}
            />

            {/* {items.map((_, i) => (
              <button key={i} className="shrink-0">
                hello
              </button>
            ))} */}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        {children}
        {/* </div> */}
      </div>
    </>
  );
}

export default page;
