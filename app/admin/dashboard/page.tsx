"use client";

import Link from "next/link";
import { Users, Building2, GraduationCap, Network, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAdminSession } from "@/context/AdminSessionContext";
import { roleStatLine } from "@/lib/role-labels";

const quickLinks = [
  {
    href: "/admin/staff/new",
    label: "Invite staff",
    icon: UserPlus,
    description: "Add RA, AD, or SA",
  },
  {
    href: "/admin/staff",
    label: "Manage staff",
    icon: Users,
    description: "View and edit assignments",
  },
  {
    href: "/admin/communities",
    label: "Communities",
    icon: Building2,
    description: "Sections and staff rosters",
  },
  {
    href: "/admin/residents",
    label: "All residents",
    icon: GraduationCap,
    description: "Search across communities",
  },
  {
    href: "/admin/structure",
    label: "Org structure",
    icon: Network,
    description: "Reporting relationships",
  },
];

export default function AdminDashboardPage() {
  const { stats } = useAdminSession();

  return (
    <div className="space-y-4 pb-4 mx-3">
      <div>
        <h1 className="text-xl font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Housing operations at a glance
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Staff
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {(stats.staff.RA ?? 0) +
              (stats.staff.GA ?? 0) +
              (stats.staff.SA ?? 0)}
            <p className="text-xs text-muted-foreground font-normal mt-1">
              {roleStatLine(stats.staff)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending invites
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {stats.pendingInvites}
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

      <div className="flex flex-col gap-2">
        <Button asChild className="w-full text-white">
          <Link href="/admin/resident-requests">Review resident requests</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/admin/add-multiple-residents">Bulk import residents</Link>
        </Button>
      </div>
    </div>
  );
}
