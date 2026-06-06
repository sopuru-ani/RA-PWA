"use client";

import { Suspense } from "react";
import ProgramsListView from "@/components/programs/ProgramsListView";
import ListSkeleton from "@/components/housing/ListSkeleton";

type Props = {
  role: string;
  basePath: string;
  modes?: ("mine" | "monitoring" | "pending")[];
  showCreate?: boolean;
  showCalendarLink?: boolean;
};

export default function ProgramsListPage(props: Props) {
  return (
    <Suspense fallback={<div className="mx-3 py-4"><ListSkeleton rows={4} /></div>}>
      <ProgramsListView {...props} />
    </Suspense>
  );
}
