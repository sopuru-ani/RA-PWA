"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ProgramForm from "@/components/programs/ProgramForm";
import ListSkeleton from "@/components/housing/ListSkeleton";
import { useNotification } from "@/context/notification-context";
import { useProgramCommunityOptions } from "@/hooks/use-program-community-options";
import { createProgram } from "@/lib/programs-api";
import type { CreateProgramInput } from "@/types/programs";

type Props = {
  backHref: string;
  detailBasePath: string;
};

export default function ProgramNewPage({ backHref, detailBasePath }: Props) {
  const router = useRouter();
  const { show } = useNotification();
  const { communities, loading: communitiesLoading, error } =
    useProgramCommunityOptions();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(input: CreateProgramInput) {
    setLoading(true);
    try {
      const program = await createProgram(input);
      show({ msg: "Draft saved", type: "success", duration: 3000 });
      router.push(`${detailBasePath}/${program._id}`);
    } catch (err) {
      show({
        msg: err instanceof Error ? err.message : "Failed to create program",
        type: "error",
        closable: true,
        duration: null,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-3 pb-8">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to programs
      </Link>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">New program</h1>
        <p className="text-sm text-muted-foreground">
          Save as a draft, then submit for admin approval when ready.
        </p>
      </div>

      {communitiesLoading ? (
        <ListSkeleton rows={8} />
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <ProgramForm
          availableCommunities={communities}
          loading={loading}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
