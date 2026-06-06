"use client";

import { use } from "react";
import ProgramDetailPage from "@/components/programs/ProgramDetailPage";

export default function SAProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <ProgramDetailPage
      programId={id}
      backHref="/sa/dashboard/programs"
      editHref={`/sa/dashboard/programs/${id}/edit`}
    />
  );
}
