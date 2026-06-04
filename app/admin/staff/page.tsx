"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import StaffListItem from "@/components/housing/StaffListItem";
import { apiFetch } from "@/lib/api-client";
import type { StaffListItem as StaffItem } from "@/types/admin";
import Empty from "@/components/RA/Empty";
import { roleLabelOption } from "@/lib/role-labels";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

export default function AdminStaffPage() {
  const [items, setItems] = useState<StaffItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [role, setRole] = useState<string>("all");
  const [q, setQ] = useState("");

  const fetchStaff = useCallback(
    async (opts: { append: boolean; cursor?: string | null }) => {
      const params = new URLSearchParams({ limit: "25" });
      if (role !== "all") params.set("role", role);
      if (q.trim()) params.set("q", q.trim());
      if (opts.cursor) params.set("cursor", opts.cursor);

      const res = await apiFetch(`api/admin/staff?${params}`, { method: "GET" });
      const data = await res.json();

      if (opts.append) {
        setItems((prev) => [...prev, ...(data.items ?? [])]);
      } else {
        setItems(data.items ?? []);
      }
      setNextCursor(data.nextCursor ?? null);
    },
    [role, q],
  );

  useEffect(() => {
    setLoading(true);
    setCursor(null);
    fetchStaff({ append: false })
      .finally(() => setLoading(false));
  }, [fetchStaff]);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    await fetchStaff({ append: true, cursor: nextCursor });
    setCursor(nextCursor);
    setLoadingMore(false);
  }

  return (
    <div className="flex flex-col h-full space-y-3 pb-4 mx-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Staff</h1>
          <p className="text-sm text-muted-foreground">
            RAs, Area Directors, SAs, and invites
          </p>
        </div>
        <Button asChild size="sm" className="text-white">
          <Link href="/admin/staff/new">
            <UserPlus className="h-4 w-4 mr-1" />
            Invite
          </Link>
        </Button>
      </div>

      <div className="flex gap-2">
        {/* <Input
          placeholder="search name or email..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1"
        /> */}
        <InputGroup className="flex-1">
          <InputGroupInput
            placeholder="search name or email..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
            }}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          {q && (
            <button
              onClick={() => setQ("")}
              className="rounded-full hover:bg-gray-200 p-1 absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </InputGroup>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="RA">RA</SelectItem>
            <SelectItem value="GA">{roleLabelOption("GA")}</SelectItem>
            <SelectItem value="SA">SA</SelectItem>
            <SelectItem value="Admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : items.length === 0 ? (
        <Empty message="No staff found" />
      ) : (
        <ScrollArea className="flex-1 overflow-y-auto rounded-xs pr-2">
          <div className="space-y-1">
            {items.map((s) => (
              <StaffListItem
                key={`${s.source}-${s.id}`}
                staff={s}
                detailHref={`/admin/staff/${s.id}`}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {nextCursor ? (
        <Button
          variant="outline"
          className="w-full text-white"
          disabled={loadingMore}
          onClick={() => loadMore()}
        >
          {loadingMore ? "Loading..." : "Load more"}
        </Button>
      ) : null}
    </div>
  );
}
