"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import ResidentListItem from "@/components/housing/ResidentListItem";
import { apiFetch } from "@/lib/api-client";
import type { ResidentWithStaff } from "@/types/admin";
import Empty from "@/components/RA/Empty";
import ListSkeleton from "@/components/housing/ListSkeleton";
import { Search, UserPlus, Upload, X } from "lucide-react";

function ResidentsPageContent() {
  const searchParams = useSearchParams();
  const communityFilter = searchParams.get("community") ?? "";

  const [items, setItems] = useState<ResidentWithStaff[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [q, setQ] = useState("");

  const fetchResidents = useCallback(
    async (opts: { append: boolean; cursor?: string | null }) => {
      const params = new URLSearchParams({ limit: "30" });
      if (communityFilter) params.set("community", communityFilter);
      if (q.trim()) params.set("q", q.trim());
      if (opts.cursor) params.set("cursor", opts.cursor);

      const res = await apiFetch(`api/admin/residents?${params}`, {
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
    [communityFilter, q],
  );

  useEffect(() => {
    setLoading(true);
    fetchResidents({ append: false }).finally(() => setLoading(false));
  }, [fetchResidents]);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    await fetchResidents({ append: true, cursor: nextCursor });
    setLoadingMore(false);
  }

  const communityQuery = communityFilter
    ? `?community=${encodeURIComponent(communityFilter)}`
    : "";

  return (
    <div className="flex flex-col space-y-3 pb-4 mx-3 h-full">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Residents</h1>
          <p className="text-sm text-muted-foreground">
            {communityFilter
              ? `Filtered: ${communityFilter}`
              : "All communities"}
          </p>
        </div>
        <div className="flex flex-row gap-1">
          <Button asChild size="sm" className="text-white">
            <Link href={`/admin/residents/add${communityQuery}`}>
              <UserPlus className="h-4 w-4 mr-1" />
              Add
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/admin/residents/bulk${communityQuery}`}>
              <Upload className="h-4 w-4 mr-1" />
              Bulk
            </Link>
          </Button>
        </div>
      </div>

      {/* <Input
        placeholder="Search name, email, room, ID..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      /> */}
      <InputGroup className="">
        <InputGroupInput
          placeholder="search name, email, room, ID..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            aria-label="Clear search"
            className="rounded-full p-1 absolute right-2 top-1/2 -translate-y-1/2 hover:bg-muted"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </InputGroup>

      {loading ? (
        <ListSkeleton rows={6} />
      ) : items.length === 0 ? (
        <Empty message="No residents found" />
      ) : (
        <ScrollArea className="flex-1 overflow-y-auto rounded-xs pr-2">
          <div className="space-y-1 pr-2">
            {items.map((r) => (
              <ResidentListItem key={r._id} resident={r} />
            ))}
          </div>
        </ScrollArea>
      )}

      {nextCursor ? (
        <Button
          variant="outline"
          className="w-full"
          disabled={loadingMore}
          onClick={() => loadMore()}
        >
          {loadingMore ? "Loading..." : "Load more"}
        </Button>
      ) : null}
    </div>
  );
}

export default function AdminResidentsPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={6} />}>
      <ResidentsPageContent />
    </Suspense>
  );
}
