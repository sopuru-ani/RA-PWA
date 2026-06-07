"use client";

import Link from "next/link";
import { GraduationCap, AlertTriangle, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSASession } from "@/context/SASessionContext";
import ProgramOverviewSection from "@/components/programs/ProgramOverviewSection";

const quickLinks = [
  {
    href: "/sa/dashboard/residents",
    label: "Residents",
    icon: GraduationCap,
    description: "View residents in your community",
  },
  {
    href: "/sa/dashboard/incidents",
    label: "Incidents",
    icon: AlertTriangle,
    description: "Reports you submitted",
  },
];

export default function SADashboardPage() {
  const { community, stats } = useSASession();

  return (
    <div className="space-y-4 pb-4 mx-3">
      <div>
        <h1 className="text-xl font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground">
          {community.name} · {community.sections.length} sections ·{" "}
          {community.residentCount} residents
        </p>
      </div>

      <ProgramOverviewSection
        role="SA"
        stats={stats.programStats}
      />

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">My open reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{stats.myOpenIncidents}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Community open
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{stats.communityOpenIncidents}</p>
            <p className="text-xs text-muted-foreground font-normal mt-1">
              All reporters
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Quick actions</p>
        <div className="grid gap-2">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="hover:border-primary/30 transition-colors">
                <CardContent className="flex items-center gap-3 py-3">
                  <link.icon className="h-5 w-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{link.label}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {link.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {community.sectionStaff.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-1">
            <Users className="h-4 w-4" />
            Sections & RAs
          </p>
          {community.sectionStaff.map((s) => (
            <Card key={s.section}>
              <CardContent className="py-3 text-sm">
                <p className="font-medium">{s.section}</p>
                <p className="text-muted-foreground">RA: {s.raEmail || "—"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <Button asChild className="w-full text-white">
        <Link href="/sa/dashboard/incidents">Report an incident</Link>
      </Button>
    </div>
  );
}
