"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import ResidentListItem from "@/components/housing/ResidentListItem";
import ListSearchInput from "@/components/housing/ListSearchInput";
import { apiFetch } from "@/lib/api-client";
import type { ResidentWithStaff } from "@/types/admin";
import Empty from "@/components/RA/Empty";
import ListSkeleton from "@/components/housing/ListSkeleton";
import { UserPlus, Upload } from "lucide-react";
import { useGASession } from "@/context/GASessionContext";

export default function GAResidentsPage() {
  const { community } = useGASession();
  const [items, setItems] = useState<ResidentWithStaff[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const initialLoad = useRef(true);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(timer);
  }, [q]);

  const fetchResidents = useCallback(
    async (opts: { append: boolean; cursor?: string | null }) => {
      const params = new URLSearchParams({ limit: "30" });
      if (debouncedQ.trim()) params.set("q", debouncedQ.trim());
      if (opts.cursor) params.set("cursor", opts.cursor);

      const res = await apiFetch(`api/ga/residents?${params}`, {
        method: "GET",
      });
      const data = await res.json();

      if (opts.append) {
        setItems((prev) => [...prev, ...(data.items ?? [])]);
      } else {
        setItems(data.items ?? []);
      }
      setNextCursor(data.nextCursor ?? null);
    },
    [debouncedQ],
  );

  useEffect(() => {
    setLoading(true);
    fetchResidents({ append: false }).finally(() => {
      setLoading(false);
      initialLoad.current = false;
    });
  }, [fetchResidents]);

  if (initialLoad.current && loading) {
    return <ListSkeleton rows={6} />;
  }

  return (
    <div className="flex flex-col space-y-3 pb-4 mx-3 h-full">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Residents</h1>
          <p className="text-sm text-muted-foreground">{community.name}</p>
        </div>
        <div className="flex flex-row gap-1">
          <Button asChild size="sm">
            <Link href="/ga/dashboard/residents/add">
              <UserPlus className="h-4 w-4 mr-1" />
              Add
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/ga/dashboard/residents/bulk">
              <Upload className="h-4 w-4 mr-1" />
              Bulk
            </Link>
          </Button>
        </div>
      </div>

      <ListSearchInput
        placeholder="Search name, email, room, ID..."
        value={q}
        onChange={setQ}
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : items.length === 0 ? (
        <Empty message="No residents found" />
      ) : (
        <ScrollArea className="flex-1 overflow-y-auto rounded-xs pr-2">
          <div className="space-y-1 pb-4">
            {items.map((r) => (
              <ResidentListItem
                key={r._id}
                resident={r}
                href={`/ga/dashboard/residents/${r._id}`}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {nextCursor ? (
        <Button
          variant="outline"
          className="w-full"
          disabled={loadingMore}
          onClick={async () => {
            setLoadingMore(true);
            await fetchResidents({ append: true, cursor: nextCursor });
            setLoadingMore(false);
          }}
        >
          {loadingMore ? "Loading..." : "Load more"}
        </Button>
      ) : null}
    </div>
  );
}
