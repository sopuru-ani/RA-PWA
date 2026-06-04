"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import ListSkeleton from "@/components/housing/ListSkeleton";
import type { ResidentRequestListItem } from "@/types/ga";
import Empty from "@/components/RA/Empty";

export default function GAResidentRequestsPage() {
  const [items, setItems] = useState<ResidentRequestListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await apiFetch("api/ga/resident-requests?limit=50", {
      method: "GET",
    });
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <ListSkeleton rows={5} />;

  return (
    <div className="space-y-4 pb-4 mx-3">
      <Link
        href="/ga/dashboard/residents"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Residents
      </Link>

      <div>
        <h1 className="text-xl font-semibold">My requests</h1>
        <p className="text-sm text-muted-foreground">
          Resident additions awaiting admin review
        </p>
      </div>

      {items.length === 0 ? (
        <Empty message="No requests yet" />
      ) : (
        <div className="space-y-2">
          {items.map((r) => (
            <Card key={r._id} className=" py-2 md:border-0 md:border-b md:shadow-none md:rounded-none">
              <CardContent className="py-3 text-sm space-y-1">
                <div className="flex justify-between items-start gap-2">
                  <p className="font-medium">{r.fullName}</p>
                  <Badge
                    variant={
                      r.status === "approved"
                        ? "default"
                        : r.status === "rejected"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {r.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  {r.section} · Room {r.room}
                </p>
                <p className="text-muted-foreground">{r.email}</p>
                {r.rejectionReason ? (
                  <p className="text-red-600 text-xs">{r.rejectionReason}</p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
