"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ProgramForm from "@/components/programs/ProgramForm";
import { useNotification } from "@/context/notification-context";
import { createProgram } from "@/lib/programs-api";
import type { CreateProgramInput } from "@/types/programs";

type Props = {
  backHref: string;
  detailBasePath: string;
  communities: string[];
  allowDepartmentWide?: boolean;
};

export default function ProgramNewPage({
  backHref,
  detailBasePath,
  communities,
  allowDepartmentWide = true,
}: Props) {
  const router = useRouter();
  const { show } = useNotification();
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
    <div className="space-y-4 pb-4 mx-3">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Programs
      </Link>
      <div>
        <h1 className="text-xl font-semibold">New program</h1>
        <p className="text-sm text-muted-foreground">
          Save as draft, then submit for admin approval
        </p>
      </div>
      <ProgramForm
        availableCommunities={communities}
        allowDepartmentWide={allowDepartmentWide}
        loading={loading}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
