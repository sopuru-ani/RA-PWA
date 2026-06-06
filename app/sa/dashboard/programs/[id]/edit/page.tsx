"use client";

import { use } from "react";
import ProgramEditPage from "@/components/programs/ProgramEditPage";
import { useSASession } from "@/context/SASessionContext";

export default function SAProgramEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { community } = useSASession();

  return (
    <ProgramEditPage
      programId={id}
      backHref="/sa/dashboard/programs"
      detailHref={`/sa/dashboard/programs/${id}`}
      communities={[community.name]}
    />
  );
}
