"use client";

import { use } from "react";
import ProgramEditPage from "@/components/programs/ProgramEditPage";
import { useGASession } from "@/context/GASessionContext";

export default function GAProgramEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { community } = useGASession();
  const communities = [community.name];

  return (
    <ProgramEditPage
      programId={id}
      backHref="/ga/dashboard/programs"
      detailHref={`/ga/dashboard/programs/${id}`}
      communities={communities}
    />
  );
}
