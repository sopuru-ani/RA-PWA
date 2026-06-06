"use client";

import { use } from "react";
import ProgramDetailPage from "@/components/programs/ProgramDetailPage";

export default function AdminProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <ProgramDetailPage
      programId={id}
      backHref="/admin/programs"
      editHref={`/admin/programs/${id}/edit`}
    />
  );
}
