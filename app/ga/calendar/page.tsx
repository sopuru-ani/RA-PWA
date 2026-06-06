"use client";

import ProgramsCalendarPage from "@/components/programs/ProgramsCalendarPage";

export default function GACalendarPage() {
  return (
    <ProgramsCalendarPage
      detailPath={(id) => `/ga/dashboard/programs/${id}`}
      programsHref="/ga/dashboard/programs"
    />
  );
}
