"use client";

import ProgramNewPage from "@/components/programs/ProgramNewPage";
import { useCommunityOptions } from "@/hooks/use-community-options";

export default function AdminProgramNewPage() {
  const { communities } = useCommunityOptions();
  const names = communities.map((c) => c.name);

  return (
    <ProgramNewPage
      backHref="/admin/programs"
      detailBasePath="/admin/programs"
      communities={names}
    />
  );
}
