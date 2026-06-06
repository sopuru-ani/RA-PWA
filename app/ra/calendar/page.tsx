"use client";

import ProgramsCalendarPage from "@/components/programs/ProgramsCalendarPage";

export default function RACalendarPage() {
  return (
    <ProgramsCalendarPage
      detailPath={(id) => `/ra/dashboard/programs/${id}`}
      programsHref="/ra/dashboard/programs"
      standalone
    />
  );
}
