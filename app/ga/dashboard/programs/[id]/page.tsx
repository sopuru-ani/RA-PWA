"use client";

import { use } from "react";
import ProgramDetailPage from "@/components/programs/ProgramDetailPage";

export default function GAProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <ProgramDetailPage
      programId={id}
      backHref="/ga/dashboard/programs"
      editHref={`/ga/dashboard/programs/${id}/edit`}
    />
  );
}
