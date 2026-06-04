"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ResidentBulkImport from "@/components/housing/ResidentBulkImport";
import { useGASession } from "@/context/GASessionContext";

export default function GABulkResidentsPage() {
  const { community } = useGASession();

  return (
    <div className="space-y-3 mx-3">
      <Link
        href="/ga/dashboard/residents"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Residents
      </Link>
      <div>
        <h1 className="text-xl font-semibold">Bulk add residents</h1>
        <p className="text-sm text-muted-foreground">
          {community.name} — all rows require admin approval
        </p>
      </div>
      <ResidentBulkImport
        lockedCommunity={community.name}
        submitPath="api/ga/resident-requests/bulk"
        submitButtonLabel="Submit for approval"
        successMessage={(r) =>
          `${r.created ?? 0} submitted${r.failed ? `, ${r.failed} failed` : ""}.`
        }
      />
    </div>
  );
}
