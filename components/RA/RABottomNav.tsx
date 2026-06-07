"use client";

import {
  Users,
  DoorOpen,
  DoorClosed,
  AlertTriangle,
  Croissant,
  NotebookPen,
  Notebook,
} from "lucide-react";

import { NavItem } from "@/components/NavItem";
import ProgramsNavItem from "@/components/nav/ProgramsNavItem";
import RAMore from "./RAMore";
import { bottomNavClassName, bottomNavGridClassName } from "@/lib/bottom-nav";
import { useResidents } from "@/context/RAResidentProvider";

function RABottomNav() {
  const { programStats } = useResidents();

  return (
    <nav className={bottomNavClassName()}>
      <div className={bottomNavGridClassName(6)}>
        <NavItem label="Residents" icon={[Users, Users]} href="/ra/dashboard" />
        <NavItem
          label="Vacancies"
          icon={[DoorOpen, DoorClosed]}
          href="/ra/dashboard/vacancies"
        />
        <NavItem
          label="Incidents"
          icon={[AlertTriangle, AlertTriangle]}
          href="/ra/dashboard/incidents"
        />
        <NavItem
          label="Inspections"
          icon={[NotebookPen, Notebook]}
          href="/ra/dashboard/inspections"
        />
        <ProgramsNavItem
          href="/ra/dashboard/programs"
          stats={programStats}
        />
        <RAMore label="More" icon={Croissant} />
      </div>
    </nav>
  );
}

export default RABottomNav;
