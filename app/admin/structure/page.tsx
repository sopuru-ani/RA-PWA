"use client";

import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api-client";
import Empty from "@/components/RA/Empty";

type StructureCommunity = {
  community: string;
  ga: { email: string; fullName: string | null }[];
  sa: { email: string; fullName: string | null }[];
  sections: {
    name: string;
    ra: { email: string; fullName: string | null } | null;
    ga: { email: string; fullName: string | null } | null;
    residentCount: number;
    hasRa: boolean;
  }[];
  gaps: {
    missingGa: boolean;
    sectionsWithoutRa: string[];
  };
};

export default function AdminStructurePage() {
  const [communities, setCommunities] = useState<StructureCommunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await apiFetch("api/admin/structure", { method: "GET" });
      const data = await res.json();
      if (res.ok) setCommunities(data.communities ?? []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-3 pb-4 mx-3 h-full">
      <div>
        <h1 className="text-xl font-semibold">Structure</h1>
        <p className="text-sm text-muted-foreground">
          Communities, staff hierarchy, and coverage gaps
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : communities.length === 0 ? (
        <Empty message="No organizational data" />
      ) : (
        <Accordion type="multiple" className="w-full space-y-2">
          {communities.map((c) => (
            <Card key={c.community} className="p-4">
              <AccordionItem value={c.community} className="border-0">
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="text-left">
                    <p className="font-medium">{c.community}</p>
                    {(c.gaps.missingGa ||
                      c.gaps.sectionsWithoutRa.length > 0) && (
                      <Badge variant="destructive" className="mt-1 bg-red-500/10 text-red-500 dark:bg-red-900/10 dark:text-red-400">
                        Needs attention
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm pb-3">
                  {c.ga.length > 0 ? (
                    <div>
                      <p className="font-medium mb-1">Area Directors</p>
                      {c.ga.map((g) => (
                        <p key={g.email} className="text-muted-foreground">
                          {g.fullName ?? g.email}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No Area Director assigned at community level
                    </p>
                  )}

                  {c.sa.length > 0 ? (
                    <div>
                      <p className="font-medium mb-1">Student assistants</p>
                      {c.sa.map((s) => (
                        <p key={s.email} className="text-muted-foreground">
                          {s.fullName ?? s.email}
                        </p>
                      ))}
                    </div>
                  ) : null}

                  <div className="space-y-1">
                    <p className="font-medium">Sections</p>
                    {c.sections.map((s) => (
                      <div
                        key={s.name}
                        className="rounded-none border-b px-3 py-2"
                      >
                        <p className="font-medium">Section {s.name}</p>
                        <p className="text-muted-foreground">
                          RA: {s.ra?.fullName ?? s.ra?.email ?? "—"}
                        </p>
                        <p className="text-muted-foreground">
                          {s.residentCount} residents
                        </p>
                        {!s.hasRa ? (
                          <Badge variant="outline" className="mt-1">
                            Missing RA
                          </Badge>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Card>
          ))}
        </Accordion>
      )}
    </div>
  );
}
