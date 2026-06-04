"use client";

import { useEffect, useMemo, useState } from "react";
import ButtonsAndSearchBar from "@/components/RA/ButtonsAndSearchBar";
import ResidentListItem from "@/components/housing/ResidentListItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ListSkeleton from "@/components/housing/ListSkeleton";
import Empty from "@/components/RA/Empty";
import { apiFetch } from "@/lib/api-client";
import { useSASession } from "@/context/SASessionContext";
import type { ResidentWithStaff } from "@/types/admin";

async function fetchAllResidents(): Promise<ResidentWithStaff[]> {
  const all: ResidentWithStaff[] = [];
  let cursor: string | null = null;

  for (;;) {
    const params = new URLSearchParams({ limit: "100" });
    if (cursor) params.set("cursor", cursor);
    const res = await apiFetch(`api/sa/residents?${params}`, { method: "GET" });
    const data = await res.json();
    if (!res.ok) break;

    const items = (data.items ?? []) as ResidentWithStaff[];
    all.push(...items);
    cursor = data.nextCursor ?? null;
    if (!cursor) break;
  }

  return all;
}

export default function SAResidentsPage() {
  const { user, community } = useSASession();
  const communityName = user.community[0] ?? community.name;
  const defaultSection = user.assignment[0] ?? community.sections[0] ?? "";

  const [residents, setResidents] = useState<ResidentWithStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(
    user.assignment[0] ? "Section" : "Community",
  );
  const [sort, setSort] = useState("Names");
  const [search, setSearch] = useState("");
  const [sectionPick, setSectionPick] = useState(defaultSection);

  useEffect(() => {
    fetchAllResidents()
      .then(setResidents)
      .finally(() => setLoading(false));
  }, []);

  const filteredResidents = useMemo(() => {
    return residents
      .filter((r) => {
        if (selected === "Section" && sectionPick) {
          return r.community === communityName && r.section === sectionPick;
        }
        return r.community === communityName;
      })
      .filter((r) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          r.fullName.toLowerCase().includes(q) || r.room.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sort === "Names") {
          return a.fullName.localeCompare(b.fullName);
        }
        const sectionCompare = a.section.localeCompare(b.section);
        if (sectionCompare !== 0) return sectionCompare;
        return Number(a.room) - Number(b.room);
      });
  }, [
    residents,
    selected,
    sectionPick,
    communityName,
    search,
    sort,
  ]);

  if (loading) return <ListSkeleton rows={6} />;

  return (
    <div className="flex flex-col h-full">
      <div className="mx-3 mb-2">
        <h1 className="text-xl font-semibold">Residents</h1>
        <p className="text-sm text-muted-foreground">{community.name}</p>
      </div>

      <div className="mx-3">
        <ButtonsAndSearchBar
          selected={selected}
          setSelected={setSelected}
          setSort={setSort}
          sort={sort}
          search={search}
          setSearch={setSearch}
        />
        {selected === "Section" && community.sections.length > 0 ? (
          <Select value={sectionPick} onValueChange={setSectionPick}>
            <SelectTrigger className="w-full mb-2">
              <SelectValue placeholder="Select section" />
            </SelectTrigger>
            <SelectContent>
              {community.sections.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      {filteredResidents.length === 0 ? (
        <Empty
          message="There are no residents currently available"
          description="Residents in your community will appear here"
        />
      ) : (
        <ScrollArea className="flex-1 overflow-y-auto rounded-xs">
          <div className="flex flex-col gap-1 mx-3 pb-1">
            {filteredResidents.map((r) => (
              <ResidentListItem
                key={r._id}
                resident={r}
                href={`/sa/dashboard/residents/${r._id}`}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
