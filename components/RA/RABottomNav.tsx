"use client";
import {
  Users,
  DoorOpen,
  DoorClosed,
  AlertTriangle,
  Menu,
  Croissant,
  NotebookPen,
  Notebook,
} from "lucide-react";

import { NavItem } from "@/components/NavItem";
import RAMore from "./RAMore";

function RABottomNav() {
  return (
    <nav className="relative border-t bg-background">
      <div className="flex justify-around">
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
        {/* <NavItem label="More" icon={Menu} href="/ra/dashboard/more" /> */}
        <RAMore label="More" icon={Croissant} />
      </div>
    </nav>
  );
}

export default RABottomNav;
