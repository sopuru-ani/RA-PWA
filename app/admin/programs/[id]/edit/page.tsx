"use client";

import { use } from "react";
import ProgramEditPage from "@/components/programs/ProgramEditPage";

export default function AdminProgramEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <ProgramEditPage
      programId={id}
      backHref="/admin/programs"
      detailHref={`/admin/programs/${id}`}
    />
  );
}
