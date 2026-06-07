"use client";

import {
  GraduationCap,
  AlertTriangle,
  LayoutDashboard,
  Croissant,
} from "lucide-react";
import { NavItem } from "@/components/NavItem";
import ProgramsNavItem from "@/components/nav/ProgramsNavItem";
import SAMore from "./SAMore";
import { bottomNavClassName, bottomNavGridClassName } from "@/lib/bottom-nav";
import { useSASession } from "@/context/SASessionContext";

function SABottomNav() {
  const { stats } = useSASession();

  return (
    <nav className={bottomNavClassName()}>
      <div className={bottomNavGridClassName(5)}>
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
        <ProgramsNavItem
          href="/sa/dashboard/programs"
          stats={stats.programStats}
        />
        <SAMore label="More" icon={Croissant} />
      </div>
    </nav>
  );
}

export default SABottomNav;
