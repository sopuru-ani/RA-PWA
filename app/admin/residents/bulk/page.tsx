"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ResidentBulkImport from "@/components/housing/ResidentBulkImport";
import type { ImportSubmitResult } from "@/components/housing/ResidentBulkImport";

function adminSuccessMessage(result: ImportSubmitResult): string {
  const success = result.inserted ?? 0;
  const failed =
    typeof result.failed === "number"
      ? result.failed
      : Array.isArray(result.failed)
        ? result.failed.length
        : result.errors?.length ?? 0;

  if (failed === 0) {
    return `${success} residents added successfully.`;
  }
  return `${success} succeeded, ${failed} failed.`;
}

function AdminBulkResidentsContent() {
  const searchParams = useSearchParams();
  const communityFilter = searchParams.get("community") ?? "";
  const residentsHref = communityFilter
    ? `/admin/residents?community=${encodeURIComponent(communityFilter)}`
    : "/admin/residents";

  return (
    <div className="space-y-3 mx-3">
      <Link
        href={residentsHref}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Residents
      </Link>
      <div>
        <h1 className="text-xl font-semibold">Bulk add residents</h1>
        <p className="text-sm text-muted-foreground">
          {communityFilter
            ? `${communityFilter} — rows are added immediately`
            : "All rows are added immediately, no approval required"}
        </p>
      </div>
      <ResidentBulkImport
        lockedCommunity={communityFilter || undefined}
        submitPath="api/admin/seed-residents"
        submitButtonLabel="Add residents"
        successMessage={adminSuccessMessage}
      />
    </div>
  );
}

export default function AdminBulkResidentsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground mx-3">Loading...</p>}>
      <AdminBulkResidentsContent />
    </Suspense>
  );
}
