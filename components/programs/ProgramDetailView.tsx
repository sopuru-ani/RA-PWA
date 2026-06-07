"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ProgramStatusBadge from "@/components/programs/ProgramStatusBadge";
import ProgramCategoryBadge from "@/components/programs/ProgramCategoryBadge";
import ProgramRSVPButtons from "@/components/programs/ProgramRSVPButtons";
import ProgramAttendanceTable from "@/components/programs/ProgramAttendanceTable";
import ProgramAttachmentsEditor from "@/components/programs/ProgramAttachmentsEditor";
import ConfirmActionDialog from "@/components/housing/ConfirmActionDialog";
import ListSkeleton from "@/components/housing/ListSkeleton";
import { useNotification } from "@/context/notification-context";
import {
  AUDIENCE_TYPE_LABELS,
  programsBasePath,
} from "@/lib/program-labels";
import { formatDate, formatTime } from "@/lib/formatters";
import {
  approveProgram,
  cancelProgram,
  fetchProgram,
  publishProgram,
  rejectProgram,
  splitIsoToLocal,
  submitProgram,
  updateRsvp,
} from "@/lib/programs-api";
import type { Program, ProgramInvite, RsvpStatus } from "@/types/programs";

type Props = {
  programId: string;
  userRole: string;
  userId?: string;
  backHref: string;
  editHref?: string;
};

export default function ProgramDetailView({
  programId,
  userRole,
  userId,
  backHref,
  editHref,
}: Props) {
  const router = useRouter();
  const { show } = useNotification();
  const [program, setProgram] = useState<Program | null>(null);
  const [invite, setInvite] = useState<ProgramInvite | undefined>();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProgram(programId);
      setProgram(data.program);
      setInvite(data.invite);
    } catch (err) {
      show({
        msg: err instanceof Error ? err.message : "Failed to load program",
        type: "error",
        closable: true,
        duration: null,
      });
    } finally {
      setLoading(false);
    }
  }, [programId, show]);

  useEffect(() => {
    load();
  }, [load]);

  const isCreator =
    userId && program && String(program.createdBy) === String(userId);
  const isAdmin = userRole === "Admin";
  const isGa = userRole === "GA";
  const canViewAttendance =
    program &&
    program.status === "published" &&
    (isAdmin || isCreator || isGa);
  const canMarkAttendance =
    program && program.status === "published" && (isAdmin || isCreator);
  const canManageAttachments =
    program &&
    program.status !== "cancelled" &&
    (isAdmin || isCreator);

  async function runAction(
    label: string,
    fn: () => Promise<void>,
    successMsg: string,
  ) {
    setActionLoading(true);
    try {
      await fn();
      show({ msg: successMsg, type: "success", duration: 3000 });
      await load();
    } catch (err) {
      show({
        msg: err instanceof Error ? err.message : `${label} failed`,
        type: "error",
        closable: true,
        duration: null,
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRsvp(status: RsvpStatus) {
    setActionLoading(true);
    try {
      const updated = await updateRsvp(programId, status);
      setInvite(updated);
      show({ msg: "RSVP updated", type: "success", duration: 2000 });
    } catch (err) {
      show({
        msg: err instanceof Error ? err.message : "RSVP failed",
        type: "error",
        closable: true,
        duration: null,
      });
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-3 py-4">
        <ListSkeleton rows={5} />
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

  const start = splitIsoToLocal(program.startDate);
  const end = splitIsoToLocal(program.endDate);
  const base = programsBasePath(userRole);

  return (
    <div className="space-y-4 pb-4 mx-3">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Programs
      </Link>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold">{program.title}</h1>
          <ProgramStatusBadge status={program.status} />
        </div>
        <div className="flex flex-wrap gap-2">
          <ProgramCategoryBadge category={program.category} />
          {program.requiredAttendance && (
            <span className="text-xs font-medium text-primary">
              Required attendance
            </span>
          )}
        </div>
      </div>

      {program.status === "rejected" && program.rejectionReason && (
        <Alert variant="destructive">
          <AlertDescription>
            Rejected: {program.rejectionReason}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {formatDate(start.date)}
            {start.time ? ` at ${formatTime(start.time)}` : ""}
            {end.time && end.time !== start.time
              ? ` – ${formatTime(end.time)}`
              : ""}
          </span>
        </div>
        {program.location && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{program.location}</span>
          </div>
        )}
        <p className="text-muted-foreground">
          Audience: {AUDIENCE_TYPE_LABELS[program.audience.type]}
        </p>
        {program.communities.length > 0 ? (
          <p className="text-muted-foreground">
            Communities: {program.communities.join(", ")}
          </p>
        ) : (
          <p className="text-muted-foreground">Department-wide</p>
        )}
      </div>

      <p className="text-sm leading-relaxed">{program.description}</p>

      {((program.attachments?.length ?? 0) > 0 || canManageAttachments) ? (
        <ProgramAttachmentsEditor
          program={program}
          editable={Boolean(canManageAttachments)}
          onUpdate={(updated) => setProgram(updated)}
        />
      ) : null}

      {program.status === "published" && invite && (
        <div className="space-y-2 pt-2 border-t">
          <p className="text-sm font-medium">Your RSVP</p>
          <ProgramRSVPButtons
            current={invite.rsvpStatus}
            loading={actionLoading}
            onRsvp={handleRsvp}
          />
        </div>
      )}

      {canViewAttendance && (
        <div className="pt-2 border-t">
          <ProgramAttendanceTable
            programId={programId}
            readOnly={!canMarkAttendance}
            canExport={Boolean(canMarkAttendance)}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        {editHref &&
          (program.status === "draft" || program.status === "rejected") &&
          isCreator && (
            <Button asChild variant="outline" size="sm">
              <Link href={editHref}>Edit</Link>
            </Button>
          )}

        {isCreator &&
          program.createdByRole !== "Admin" &&
          (program.status === "draft" || program.status === "rejected") && (
            <ConfirmActionDialog
              trigger={
                <Button size="sm" className="text-white" disabled={actionLoading}>
                  Submit for approval
                </Button>
              }
              title="Submit for approval?"
              description="An admin will review this program before it is published and invites are sent."
              confirmLabel="Submit"
              onConfirm={() =>
                runAction(
                  "Submit",
                  async () => {
                    await submitProgram(programId);
                  },
                  "Submitted for admin approval",
                )
              }
            />
          )}

        {isAdmin &&
          isCreator &&
          program.createdByRole === "Admin" &&
          program.status === "draft" && (
            <ConfirmActionDialog
              trigger={
                <Button size="sm" className="text-white" disabled={actionLoading}>
                  Publish
                </Button>
              }
              title="Publish program?"
              description="This will generate invites and make the program visible on calendars."
              confirmLabel="Publish"
              onConfirm={() =>
                runAction(
                  "Publish",
                  async () => {
                    const result = await publishProgram(programId);
                    show({
                      msg: `Published · ${result.inviteCount} invites sent`,
                      type: "success",
                      duration: 4000,
                    });
                    await load();
                  },
                  "Program published",
                )
              }
            />
          )}

        {isAdmin && program.status === "pending_approval" && (
          <>
            <ConfirmActionDialog
              trigger={
                <Button size="sm" className="text-white" disabled={actionLoading}>
                  Approve & publish
                </Button>
              }
              title="Approve program?"
              description="This will publish the program and send invites."
              confirmLabel="Approve"
              onConfirm={() =>
                runAction(
                  "Approve",
                  async () => {
                    const result = await approveProgram(programId);
                    show({
                      msg: `Approved · ${result.inviteCount} invites sent`,
                      type: "success",
                      duration: 4000,
                    });
                    await load();
                  },
                  "Program approved",
                )
              }
            />
            <div className="w-full space-y-2">
              <Textarea
                placeholder="Rejection reason (optional)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={2}
              />
              <ConfirmActionDialog
                trigger={
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={actionLoading}
                  >
                    Reject
                  </Button>
                }
                title="Reject program?"
                description="The creator can edit and resubmit after rejection."
                confirmLabel="Reject"
                destructive
                onConfirm={() =>
                  runAction(
                    "Reject",
                    async () => {
                      await rejectProgram(programId, rejectionReason);
                    },
                    "Program rejected",
                  )
                }
              />
            </div>
          </>
        )}

        {program.status === "published" && (isCreator || isAdmin) && (
          <ConfirmActionDialog
            trigger={
              <Button size="sm" variant="destructive" disabled={actionLoading}>
                Cancel program
              </Button>
            }
            title="Cancel program?"
            description="Invitees will no longer see this as an active program."
            confirmLabel="Cancel program"
            destructive
            onConfirm={() =>
              runAction(
                "Cancel",
                async () => {
                  await cancelProgram(programId);
                  router.push(base);
                },
                "Program cancelled",
              )
            }
          />
        )}
      </div>
    </div>
  );
}
