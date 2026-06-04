import { Suspense } from "react";
import ListSkeleton from "@/components/housing/ListSkeleton";

export default function GAInspectionSessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<ListSkeleton rows={6} />}>{children}</Suspense>;
}
