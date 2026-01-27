"use client";
import { useState } from "react";
import { ScrollArea } from "@radix-ui/react-scroll-area";
// import { ToggleGroup, ToggleGroupItem } from "@radix-ui/react-toggle-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { useResidents } from "@/context/RAResidentProvider";
import { ResidentLean } from "@/db/resident.model";
import { RoomLean } from "@/db/room.model";
import { Card, CardContent } from "@/components/ui/card";
import { UserType } from "@/db/user.model";
import Empty from "@/components/RA/Empty";
import RADashboardSkeleton from "@/components/RA/RADashboardSkeleton";
import { useVerifyAuth } from "@/hooks/useVerifyAuth";

function page() {
  const checkingAuth = useVerifyAuth();
  const { vacancy, user }: { vacancy: RoomLean[]; user: UserType } =
    useResidents();

  if (checkingAuth) {
    return <RADashboardSkeleton />;
  }

  const [empty, setEmpty] = useState<boolean>(false);
  const [selected, setSelected] = useState("Section");
  const filteredVacancy = vacancy.filter((v) => {
    if (selected === "Section") {
      return (
        v.community === user.community[0] && v.section === user.assignment[0]
      );
    }
    return v.community === user.community[0];
  });
  if (filteredVacancy.length < 1) setEmpty(true);

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="mb-2 ml-3">
          <ToggleGroup
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
          </ToggleGroup>
        </div>

        {empty ? (
          <Empty
            message="No vacant rooms"
            description="All rooms in this section/community are currently occupied."
          />
        ) : (
          <ScrollArea className="flex-1 overflow-y-auto rounded-xs">
            <div className="flex flex-col gap-1 mx-3 pb-1">
              {filteredVacancy.map((i) => (
                <Card
                  key={i._id}
                  className="px-3 py-1 md:border-0 md:border-b md:shadow-none md:rounded-none"
                >
                  <CardContent className="flex flex-col gap-2 py-3 px-2">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm">{`${i.section} · Room ${i.room}`}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          i.vacancy === i.capacity
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {i.vacancy === i.capacity ? "Vacant" : "Full"}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex justify-between">
                      <p className="text-sm text-muted-foreground">
                        Capacity: {i.capacity}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Vacancy: {i.vacancy}
                      </p>
                    </div>

                    {/* Optional footer or action buttons */}
                    {/* <CardFooter>
      <Button size="sm" variant="outline">View</Button>
    </CardFooter> */}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </>
  );
}

export default page;
