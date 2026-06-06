"use client";

import ProgramsListPage from "@/components/programs/ProgramsListPage";

export default function SAProgramsPage() {
  return (
    <ProgramsListPage
      role="SA"
      basePath="/sa/dashboard/programs"
      modes={["mine"]}
    />
  );
}
