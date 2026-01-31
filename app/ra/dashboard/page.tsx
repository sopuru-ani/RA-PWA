"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import RACollapsibleResident from "@/components/RA/RACollapsibleResident";
import ButtonsAndSearchBar from "@/components/RA/ButtonsAndSearchBar";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { ResidentLean } from "@/db/resident.model";

import { useResidents } from "@/context/RAResidentProvider";
import { UserType } from "@/db/user.model";
import RADashboardSkeleton from "@/components/RA/RADashboardSkeleton";
import Empty from "@/components/RA/Empty";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL_LAN;

function page() {
  const { residents, user }: { residents: ResidentLean[]; user: UserType } =
    useResidents();

  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  // const [empty, setEmpty] = useState<boolean>(false);
  const [selected, setSelected] = useState("Section");
  const [sort, setSort] = useState("Names");
  const [search, setSearch] = useState("");
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
  const empty = filteredResidents.length === 0;

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
