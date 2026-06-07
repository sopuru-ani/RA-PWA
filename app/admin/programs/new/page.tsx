"use client";

import ProgramNewPage from "@/components/programs/ProgramNewPage";

export default function AdminProgramNewPage() {
  return (
    <ProgramNewPage
      backHref="/admin/programs"
      detailBasePath="/admin/programs"
    />
  );
}
