"use client";

import {
  LayoutDashboard,
  Users,
  GraduationCap,
  NotebookPen,
  Notebook,
  AlertTriangle,
  Croissant,
} from "lucide-react";
import { NavItem } from "@/components/NavItem";
import GAMore from "./GAMore";

function GABottomNav() {
  return (
    <nav className="relative border-t bg-background">
      <div className="flex justify-around">
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
          label="Inspections"
          icon={[NotebookPen, Notebook]}
          href="/ga/dashboard/inspections"
          matchPrefix
        />
        <NavItem
          label="Incidents"
          icon={[AlertTriangle, AlertTriangle]}
          href="/ga/dashboard/incidents"
          matchPrefix
        />
        <GAMore label="More" icon={Croissant} />
      </div>
    </nav>
  );
}

export default GABottomNav;
