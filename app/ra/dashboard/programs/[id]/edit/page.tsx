"use client";

import { use } from "react";
import ProgramEditPage from "@/components/programs/ProgramEditPage";
import { useResidents } from "@/context/RAResidentProvider";

export default function RAProgramEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useResidents();
  const communities = (user.community ?? []).filter(Boolean);

  return (
    <ProgramEditPage
      programId={id}
      backHref="/ra/dashboard/programs"
      detailHref={`/ra/dashboard/programs/${id}`}
      communities={communities}
    />
  );
}
