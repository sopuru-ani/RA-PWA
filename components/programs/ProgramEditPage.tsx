"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ProgramForm from "@/components/programs/ProgramForm";
import ProgramAttachmentsEditor from "@/components/programs/ProgramAttachmentsEditor";
import ListSkeleton from "@/components/housing/ListSkeleton";
import { useNotification } from "@/context/notification-context";
import { fetchProgram, updateProgram } from "@/lib/programs-api";
import type { CreateProgramInput, Program } from "@/types/programs";

type Props = {
  programId: string;
  backHref: string;
  detailHref: string;
  communities: string[];
  allowDepartmentWide?: boolean;
};

export default function ProgramEditPage({
  programId,
  backHref,
  detailHref,
  communities,
  allowDepartmentWide = true,
}: Props) {
  const router = useRouter();
  const { show } = useNotification();
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
        show({
          msg: err instanceof Error ? err.message : "Failed to load program",
          type: "error",
          closable: true,
          duration: null,
        });
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [programId, show]);

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

  if (loading) {
    return (
      <div className="mx-3 py-4">
        <ListSkeleton rows={6} />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="mx-3 py-4 text-sm text-muted-foreground">
        Program not found.
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4 mx-3">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Programs
      </Link>
      <div>
        <h1 className="text-xl font-semibold">Edit program</h1>
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
          program.communities.length > 0 ? program.communities : communities
        }
        allowDepartmentWide={allowDepartmentWide}
        loading={saving}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
