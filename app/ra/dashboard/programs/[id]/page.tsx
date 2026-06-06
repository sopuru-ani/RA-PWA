"use client";

import { use } from "react";
import ProgramDetailPage from "@/components/programs/ProgramDetailPage";

export default function RAProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <ProgramDetailPage
      programId={id}
      backHref="/ra/dashboard/programs"
      editHref={`/ra/dashboard/programs/${id}/edit`}
    />
  );
}
