"use client";

import ProgramNewPage from "@/components/programs/ProgramNewPage";
import { useSASession } from "@/context/SASessionContext";

export default function SAProgramNewPage() {
  const { community } = useSASession();

  return (
    <ProgramNewPage
      backHref="/sa/dashboard/programs"
      detailBasePath="/sa/dashboard/programs"
      communities={[community.name]}
    />
  );
}
