"use client";
import { useState } from "react";
import RACollapsibleResident from "@/components/RA/RACollapsibleResident";
import ButtonsAndSearchBar from "@/components/RA/ButtonsAndSearchBar";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { ResidentLean } from "@/db/resident.model";

import { useResidents } from "@/context/RAResidentProvider";
import { UserType } from "@/db/user.model";
import Empty from "@/components/RA/Empty";
import RADashboardSkeleton from "@/components/RA/RADashboardSkeleton";
import { useVerifyAuth } from "@/hooks/useVerifyAuth";

function page() {
  const checkingAuth = useVerifyAuth();
  const { residents, user }: { residents: ResidentLean[]; user: UserType } =
    useResidents();

  if (checkingAuth) {
    return <RADashboardSkeleton />;
  }

  const [empty, setEmpty] = useState<boolean>(false);
  const [selected, setSelected] = useState("Section");
  const [sort, setSort] = useState("Names");
  const [search, setSearch] = useState("");
  const filteredResidents = residents
    .filter((r) => {
      if (selected === "Section") {
        return (
          r.community === user.community[0] && r.section === user.assignment[0]
        );
      }
      return r.community === user.community[0];
    })
    .filter((r) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return r.fullName.toLowerCase().includes(q) || r.room.includes(q);
    })
    .sort((a, b) => {
      if (sort === "Names") {
        return a.fullName.localeCompare(b.fullName);
      }
      // return a.room.localeCompare(b.room);
      const sectionCompare = a.section.localeCompare(b.section);
      if (sectionCompare !== 0) {
        return sectionCompare;
      }

      return Number(a.room) - Number(b.room);
    });
  if (filteredResidents.length < 1) setEmpty(true);

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="mx-3">
          <ButtonsAndSearchBar
            selected={selected}
            setSelected={setSelected}
            setSort={setSort}
            sort={sort}
            search={search}
            setSearch={setSearch}
          />
        </div>

        {empty ? (
          <Empty
            message="There are no residents currently available"
            description="Residents assigned to your section/community will appear here"
          />
        ) : (
          <ScrollArea className="flex-1 overflow-y-auto rounded-xs">
            <div className="flex flex-col gap-1 mx-3 pb-1">
              {filteredResidents.map((i) => (
                <RACollapsibleResident
                  key={i._id}
                  resident={i}
                  raSection={user.assignment[0]}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </>
  );
}

export default page;
