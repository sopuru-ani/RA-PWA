"use client";

import ProgramsListPage from "@/components/programs/ProgramsListPage";

export default function RAProgramsPage() {
  return (
    <ProgramsListPage
      role="RA"
      basePath="/ra/dashboard/programs"
      modes={["mine"]}
    />
  );
}
