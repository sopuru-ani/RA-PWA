"use client";

import Link from "next/link";
import {
  Users,
  GraduationCap,
  NotebookPen,
  AlertTriangle,
  UserPlus,
  ClipboardList,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGASession } from "@/context/GASessionContext";
const quickLinks = [
  {
    href: "/ga/dashboard/staff",
    label: "Staff",
    icon: Users,
    description: "RAs and SAs in your community",
  },
  {
    href: "/ga/dashboard/residents",
    label: "Residents",
    icon: GraduationCap,
    description: "View and request new residents",
  },
  {
    href: "/ga/dashboard/inspections",
    label: "Inspections",
    icon: NotebookPen,
    description: "Walkthroughs and conduct inspections",
  },
  {
    href: "/ga/dashboard/incidents",
    label: "Incidents",
    icon: AlertTriangle,
    description: "Community incident log",
  },
];

export default function GADashboardPage() {
  const { community, stats } = useGASession();

  const raCount = community.sectionStaff?.length ?? community.raCount ?? 0;

  return (
    <div className="space-y-4 pb-4 mx-3">
      <div>
        <h1 className="text-xl font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground">
          {community.name} · {community.sections.length} sections ·{" "}
          {community.residentCount} residents
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{stats.openIncidents}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending adds</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{stats.myPendingRequests}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link href="/ga/dashboard/residents/add">
            <UserPlus className="h-4 w-4 mr-1" />
            Add resident
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/ga/dashboard/residents/requests">
            <ClipboardList className="h-4 w-4 mr-1" />
            My requests
          </Link>
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Sections & RAs</p>
        {community.sectionStaff.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No section assignments yet.
          </p>
        ) : (
          community.sectionStaff.map((s) => (
            <Card key={s.section}>
              <CardContent className="py-3 text-sm">
                <p className="font-medium">Section {s.section}</p>
                <p className="text-muted-foreground">RA: {s.raEmail}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {raCount} RA assignments in this community
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="hover:border-primary/30 transition-colors h-full">
              <CardContent className="py-4 flex gap-3">
                <link.icon className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="font-medium text-sm">{link.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {link.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
