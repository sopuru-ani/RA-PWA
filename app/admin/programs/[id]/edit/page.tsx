"use client";

import { use } from "react";
import ProgramEditPage from "@/components/programs/ProgramEditPage";
import { useCommunityOptions } from "@/hooks/use-community-options";

export default function AdminProgramEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { communities } = useCommunityOptions();
  const names = communities.map((c) => c.name);

  return (
    <ProgramEditPage
      programId={id}
      backHref="/admin/programs"
      detailHref={`/admin/programs/${id}`}
      communities={names}
    />
  );
}
