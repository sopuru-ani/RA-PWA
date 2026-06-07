"use client";

import { use } from "react";
import ProgramEditPage from "@/components/programs/ProgramEditPage";

export default function SAProgramEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <ProgramEditPage
      programId={id}
      backHref="/sa/dashboard/programs"
      detailHref={`/sa/dashboard/programs/${id}`}
    />
  );
}
