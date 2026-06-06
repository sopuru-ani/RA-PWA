"use client";

import ProgramDetailView from "@/components/programs/ProgramDetailView";
import ListSkeleton from "@/components/housing/ListSkeleton";
import { useCurrentUser } from "@/hooks/use-current-user";

type Props = {
  programId: string;
  backHref: string;
  editHref?: string;
};

export default function ProgramDetailPage({
  programId,
  backHref,
  editHref,
}: Props) {
  const { user, loading } = useCurrentUser();

  if (loading) {
    return (
      <div className="mx-3 py-4">
        <ListSkeleton rows={5} />
      </div>
    );
  }

  if (!user) return null;

  return (
    <ProgramDetailView
      programId={programId}
      userRole={user.role}
      userId={user.id}
      backHref={backHref}
      editHref={editHref}
    />
  );
}
