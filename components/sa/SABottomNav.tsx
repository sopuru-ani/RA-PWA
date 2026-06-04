"use client";

import { GraduationCap, AlertTriangle, LayoutDashboard, Croissant } from "lucide-react";
import { NavItem } from "@/components/NavItem";
import SAMore from "./SAMore";

function SABottomNav() {
  return (
    <nav className="relative border-t bg-background">
      <div className="flex justify-around">
        <NavItem
          label="Overview"
          icon={[LayoutDashboard, LayoutDashboard]}
          href="/sa/dashboard"
        />
        <NavItem
          label="Residents"
          icon={[GraduationCap, GraduationCap]}
          href="/sa/dashboard/residents"
          matchPrefix
        />
        <NavItem
          label="Incidents"
          icon={[AlertTriangle, AlertTriangle]}
          href="/sa/dashboard/incidents"
          matchPrefix
        />
        <SAMore label="More" icon={Croissant} />
      </div>
    </nav>
  );
}

export default SABottomNav;
