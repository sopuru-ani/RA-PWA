"use client";

import ProgramsCalendarPage from "@/components/programs/ProgramsCalendarPage";

export default function RADashboardCalendarPage() {
  return (
    <ProgramsCalendarPage
      detailPath={(id) => `/ra/dashboard/programs/${id}`}
      programsHref="/ra/dashboard/programs"
    />
  );
}
