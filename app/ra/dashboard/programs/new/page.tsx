"use client";

import ProgramNewPage from "@/components/programs/ProgramNewPage";
import { useResidents } from "@/context/RAResidentProvider";

export default function RAProgramNewPage() {
  const { user } = useResidents();
  const communities = (user.community ?? []).filter(Boolean);

  return (
    <ProgramNewPage
      backHref="/ra/dashboard/programs"
      detailBasePath="/ra/dashboard/programs"
      communities={communities}
    />
  );
}
