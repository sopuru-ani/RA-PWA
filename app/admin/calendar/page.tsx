"use client";

import ProgramsCalendarPage from "@/components/programs/ProgramsCalendarPage";

export default function AdminCalendarPage() {
  return (
    <ProgramsCalendarPage
      detailPath={(id) => `/admin/programs/${id}`}
      programsHref="/admin/programs"
    />
  );
}
