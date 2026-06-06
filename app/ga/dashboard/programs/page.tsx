"use client";

import ProgramsListPage from "@/components/programs/ProgramsListPage";

export default function GAProgramsPage() {
  return (
    <ProgramsListPage
      role="GA"
      basePath="/ga/dashboard/programs"
      modes={["mine", "monitoring"]}
    />
  );
}
