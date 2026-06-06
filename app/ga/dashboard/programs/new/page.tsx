"use client";

import ProgramNewPage from "@/components/programs/ProgramNewPage";
import { useGASession } from "@/context/GASessionContext";

export default function GAProgramNewPage() {
  const { community } = useGASession();
  const communities = [community.name];

  return (
    <ProgramNewPage
      backHref="/ga/dashboard/programs"
      detailBasePath="/ga/dashboard/programs"
      communities={communities}
    />
  );
}
