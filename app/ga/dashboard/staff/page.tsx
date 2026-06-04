"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import StaffListItem from "@/components/housing/StaffListItem";
import ListSearchInput from "@/components/housing/ListSearchInput";
import { apiFetch } from "@/lib/api-client";
import type { StaffListItem as StaffItem } from "@/types/admin";
import Empty from "@/components/RA/Empty";
import ListSkeleton from "@/components/housing/ListSkeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { roleLabelOption } from "@/lib/role-labels";
import { useGASession } from "@/context/GASessionContext";

export default function GAStaffPage() {
  const { community } = useGASession();
  const [items, setItems] = useState<StaffItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [role, setRole] = useState<string>("all");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const initialLoad = useRef(true);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(timer);
  }, [q]);

  const fetchStaff = useCallback(
    async (opts: { append: boolean; cursor?: string | null }) => {
      const params = new URLSearchParams({ limit: "25" });
      if (role !== "all") params.set("role", role);
      if (debouncedQ.trim()) params.set("q", debouncedQ.trim());
      if (opts.cursor) params.set("cursor", opts.cursor);

      const res = await apiFetch(`api/ga/staff?${params}`, { method: "GET" });
      const data = await res.json();

      if (opts.append) {
        setItems((prev) => [...prev, ...(data.items ?? [])]);
      } else {
        setItems(data.items ?? []);
      }
      setNextCursor(data.nextCursor ?? null);
    },
    [role, debouncedQ],
  );

  useEffect(() => {
    setLoading(true);
    fetchStaff({ append: false }).finally(() => {
      setLoading(false);
      initialLoad.current = false;
    });
  }, [fetchStaff]);

  if (initialLoad.current && loading) {
    return <ListSkeleton rows={6} />;
  }

  return (
    <div className="flex flex-col h-full space-y-3 pb-4 mx-3">
      <div>
        <h1 className="text-xl font-semibold">Staff</h1>
        <p className="text-sm text-muted-foreground">
          {community.name} — read-only
        </p>
      </div>

      <div className="flex gap-2">
        <ListSearchInput
          className="flex-1"
          placeholder="Search name or email..."
          value={q}
          onChange={setQ}
        />
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="RA">RA</SelectItem>
            <SelectItem value="SA">SA</SelectItem>
            <SelectItem value="GA">{roleLabelOption("GA")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : items.length === 0 ? (
        <Empty message="No staff found" />
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-2 pb-4">
            {items.map((s) => (
              <StaffListItem
                key={`${s.source}-${s.id}`}
                staff={s}
                detailHref={`/ga/dashboard/staff/${s.id}`}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {nextCursor ? (
        <button
          type="button"
          className="text-sm text-primary underline-offset-4 hover:underline"
          disabled={loadingMore}
          onClick={async () => {
            setLoadingMore(true);
            await fetchStaff({ append: true, cursor: nextCursor });
            setLoadingMore(false);
          }}
        >
          {loadingMore ? "Loading..." : "Load more"}
        </button>
      ) : null}
    </div>
  );
}
