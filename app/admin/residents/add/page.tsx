"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ResidentAddForm from "@/components/housing/ResidentAddForm";

function AdminAddResidentContent() {
  const searchParams = useSearchParams();
  const communityFilter = searchParams.get("community") ?? "";
  const residentsHref = communityFilter
    ? `/admin/residents?community=${encodeURIComponent(communityFilter)}`
    : "/admin/residents";

  return (
    <div className="space-y-4 pb-4 mx-3">
      <Link
        href={residentsHref}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Residents
      </Link>

      <div>
        <h1 className="text-xl font-semibold">Add resident</h1>
        <p className="text-sm text-muted-foreground">
          {communityFilter
            ? `${communityFilter} — added immediately, no approval required`
            : "Added immediately, no approval required"}
        </p>
      </div>

      <ResidentAddForm
        defaultCommunity={communityFilter}
        residentsHref={residentsHref.split("?")[0]}
      />
    </div>
  );
}

export default function AdminAddResidentPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground mx-3">Loading...</p>}>
      <AdminAddResidentContent />
    </Suspense>
  );
}
