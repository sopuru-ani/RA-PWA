"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CommunitySummary } from "@/types/admin";
import Empty from "@/components/RA/Empty";
import { roleLabelShort } from "@/lib/role-labels";

export default function AdminCommunitiesPage() {
  const [communities, setCommunities] = useState<CommunitySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await apiFetch("api/admin/communities", { method: "GET" });
      const data = await res.json();
      if (res.ok) setCommunities(data.communities ?? []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="flex flex-col h-full space-y-3 pb-4 mx-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Communities</h1>
          <p className="text-sm text-muted-foreground">
            Housing structure and staff coverage
          </p>
        </div>
        <Button asChild size="sm" className="text-white">
          <Link href="/admin/communities/new">
            <Plus className="h-4 w-4 mr-1" />
            New
          </Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : communities.length === 0 ? (
        <Empty message="No communities in the database" />
      ) : (
        <div className="space-y-2 flex flex-col overflow-y-auto rounded-xs pr-2">
          {communities.map((c) => (
            <Link
              key={c.community}
              href={`/admin/communities/${encodeURIComponent(c.community)}`}
            >
              <Card className="hover:md:border-unset md:border-0 md:rounded-none md:shadow-sm md:border-b hover:border-primary/30 transition-colors py-2">
                <CardContent className="py-3 px-4">
                  <p className="font-medium">{c.community}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {c.sectionCount} sections · {c.residentCount} residents
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {c.raCount} RA · {c.gaCount} {roleLabelShort("GA")} ·{" "}
                    {c.saCount} SA
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
