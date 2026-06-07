"use client";

import {
  LayoutDashboard,
  Users,
  GraduationCap,
  AlertTriangle,
  Croissant,
} from "lucide-react";
import { NavItem } from "@/components/NavItem";
import ProgramsNavItem from "@/components/nav/ProgramsNavItem";
import GAMore from "./GAMore";
import { bottomNavClassName, bottomNavGridClassName } from "@/lib/bottom-nav";
import { useGASession } from "@/context/GASessionContext";

function GABottomNav() {
  const { stats } = useGASession();

  return (
    <nav className={bottomNavClassName()}>
      <div className={bottomNavGridClassName(6)}>
        <NavItem
          label="Overview"
          icon={[LayoutDashboard, LayoutDashboard]}
          href="/ga/dashboard"
        />
        <NavItem
          label="Staff"
          icon={[Users, Users]}
          href="/ga/dashboard/staff"
          matchPrefix
        />
        <NavItem
          label="Residents"
          icon={[GraduationCap, GraduationCap]}
          href="/ga/dashboard/residents"
          matchPrefix
        />
        <NavItem
          label="Incidents"
          icon={[AlertTriangle, AlertTriangle]}
          href="/ga/dashboard/incidents"
          matchPrefix
        />
        <ProgramsNavItem
          href="/ga/dashboard/programs"
          stats={stats.programStats}
        />
        <GAMore label="More" icon={Croissant} />
      </div>
    </nav>
  );
}

export default GABottomNav;
