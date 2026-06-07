"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ProgramForm from "@/components/programs/ProgramForm";
import ProgramAttachmentsEditor from "@/components/programs/ProgramAttachmentsEditor";
import ListSkeleton from "@/components/housing/ListSkeleton";
import { useNotification } from "@/context/notification-context";
import { useProgramCommunityOptions } from "@/hooks/use-program-community-options";
import { fetchProgram, updateProgram } from "@/lib/programs-api";
import type { CreateProgramInput, Program } from "@/types/programs";

type Props = {
  programId: string;
  backHref: string;
  detailHref: string;
};

export default function ProgramEditPage({
  programId,
  backHref,
  detailHref,
}: Props) {
  const router = useRouter();
  const { show } = useNotification();
  const { communities, loading: communitiesLoading, error: communitiesError } =
    useProgramCommunityOptions();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await fetchProgram(programId);
        if (!mounted) return;
        setProgram(data.program);
      } catch (err) {
        if (!mounted) return;
        show({
          msg: err instanceof Error ? err.message : "Failed to load program",
          type: "error",
          duration: 3000,
        });
        router.replace(backHref);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [programId, show, router, backHref]);

  async function handleSubmit(input: CreateProgramInput) {
    setSaving(true);
    try {
      await updateProgram(programId, input);
      show({ msg: "Program updated", type: "success", duration: 3000 });
      router.push(detailHref);
    } catch (err) {
      show({
        msg: err instanceof Error ? err.message : "Failed to update program",
        type: "error",
        closable: true,
        duration: null,
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading || communitiesLoading || !program) {
    return (
      <div className="mx-auto max-w-2xl px-3 py-8">
        <ListSkeleton rows={8} />
      </div>
    );
  }

  if (communitiesError) {
    return (
      <div className="mx-auto max-w-2xl px-3 py-8 text-sm text-destructive">
        {communitiesError}
      </div>
    );
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
        <h1 className="text-2xl font-semibold tracking-tight">Edit program</h1>
        <p className="text-sm text-muted-foreground">{program.title}</p>
      </div>
      <ProgramAttachmentsEditor
        program={program}
        editable
        onUpdate={setProgram}
      />

      <ProgramForm
        excludeProgramId={programId}
        initial={{
          title: program.title,
          description: program.description,
          startDate: program.startDate,
          endDate: program.endDate,
          location: program.location,
          category: program.category,
          requiredAttendance: program.requiredAttendance,
          visibility: program.visibility,
          communities: program.communities,
          audience: program.audience,
        }}
        availableCommunities={
          program.communities.length > 0
            ? [
                ...new Set([
                  ...program.communities,
                  ...communities,
                ]),
              ]
            : communities
        }
        loading={saving}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
