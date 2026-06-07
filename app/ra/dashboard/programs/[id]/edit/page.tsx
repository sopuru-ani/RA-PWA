"use client";

import { use } from "react";
import ProgramEditPage from "@/components/programs/ProgramEditPage";

export default function RAProgramEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <ProgramEditPage
      programId={id}
      backHref="/ra/dashboard/programs"
      detailHref={`/ra/dashboard/programs/${id}`}
    />
  );
}
