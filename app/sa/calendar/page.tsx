"use client";

import ProgramsCalendarPage from "@/components/programs/ProgramsCalendarPage";

export default function SACalendarPage() {
  return (
    <ProgramsCalendarPage
      detailPath={(id) => `/sa/dashboard/programs/${id}`}
      programsHref="/sa/dashboard/programs"
    />
  );
}
