"use client";

import ProgramsListPage from "@/components/programs/ProgramsListPage";

export default function AdminProgramsPage() {
  return (
    <ProgramsListPage
      role="Admin"
      basePath="/admin/programs"
      modes={["mine", "monitoring", "pending"]}
    />
  );
}
