"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { useResidents } from "@/context/RAResidentProvider";
import { IncidentLean } from "@/db/incident.model";
import { CommunityLean } from "@/db/community.models";
import { UserType } from "@/db/user.model";
import { RoomLean } from "@/db/room.model";
import { Trash2, ShieldAlert } from "lucide-react";
import RADashboardSkeleton from "@/components/RA/RADashboardSkeleton";
import Empty from "@/components/RA/Empty";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL_LAN;
function Page() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  const {
    community,
    user,
    rooms,
    incidents,
  }: {
    community: CommunityLean[];
    user: UserType;
    rooms: RoomLean[];
    incidents: IncidentLean[];
  } = useResidents();

  const [empty, setEmpty] = useState<boolean>(false);
  const [dropdown, setDropdown] = useState("All");
  const filteredIncidents =
    dropdown === "All"
      ? incidents
      : incidents.filter((incident) => incident.type === dropdown);

  if (filteredIncidents.length < 1) setEmpty(true);
  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch(`${BASE_URL}api/auth/verify`, {
          method: "GET",
          credentials: "include",
        });

        if (res.status === 401) {
          router.replace("/login");
          return;
        }

        // Optionally, you can read the user from here if you want
        // const data = await res.json();

        setCheckingAuth(false);
      } catch (err) {
        console.error("Auth check failed", err);
        router.replace("/login");
      }
    };

    verify();
  }, [router]);

  if (checkingAuth) {
    // simple loading state while verifying access
    return <RADashboardSkeleton />;
  }

  return (
    <>
      <div className="flex flex-col h-dvh">
        <ScrollArea className="overflow-x-auto mb-2 mx-3">
          <div className="flex gap-2 overflow-x-auto whitespace-nowrap no-scrollbar">
            <DropDown dropdown={dropdown} setDropdown={setDropdown} />

            <CreateIncidentPopUp
              communityInfo={community}
              user={user}
              rooms={rooms}
              onSuccess={() => window.location.reload()}
            />
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {empty ? (
          <Empty
            message="No incidents reported"
            description="You're all caught up. Nothing to review right now."
            icon={<ShieldAlert className="h-6 w-6" />}
          />
        ) : (
          <ScrollArea className="flex-1 overflow-y-auto rounded-xs">
            <div className="flex flex-col gap-1 mx-3 pb-1">
              {filteredIncidents.map((incident, i) => (
                <Card
                  key={i}
                  className="px-3 py-2 md:border-0 md:border-b md:shadow-none md:rounded-none"
                >
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1" className="border-none">
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
                          <span
                            className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                              incident.resolved
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {incident.resolved ? "Resolved" : "Unresolved"}
                          </span>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="relative pb-10 mt-2 space-y-2 text-sm text-muted-foreground">
                        {/* ...rest of your content unchanged... */}
                        <div>
                          <EditIncidentPopUp
                            communityInfo={community}
                            user={user}
                            rooms={rooms}
                            onSuccess={() => window.location.reload()}
                            incident={incident}
                          />
                          <DeleteIncidentPopUp
                            incidentId={incident._id} // or whatever your id field is
                            onSuccess={() => window.location.reload()}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </>
  );
}

export default Page;
