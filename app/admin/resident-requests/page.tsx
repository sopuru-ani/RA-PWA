"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import ListSkeleton from "@/components/housing/ListSkeleton";
import Empty from "@/components/RA/Empty";
import ConfirmActionDialog from "@/components/housing/ConfirmActionDialog";
import { useNotification } from "@/context/notification-context";
import type {
  ResidentChangeRequestItem,
  ResidentChangeRequestType,
} from "@/types/admin";

function requestTypeLabel(type?: ResidentChangeRequestType): string {
  if (type === "update") return "Update";
  if (type === "remove") return "Removal";
  return "Add";
}

function approveDescription(item: ResidentChangeRequestItem): string {
  const type = item.requestType ?? "add";
  if (type === "remove") {
    return `Permanently remove ${item.fullName} from the system?`;
  }
  if (type === "update") {
    return `Apply proposed changes to ${item.fullName}?`;
  }
  return `Add ${item.fullName} to ${item.community} · ${item.section} · Room ${item.room}?`;
}

function groupRequests(items: ResidentChangeRequestItem[]) {
  const batches = new Map<string, ResidentChangeRequestItem[]>();
  const standalone: ResidentChangeRequestItem[] = [];

  for (const item of items) {
    if (item.batchId) {
      const list = batches.get(item.batchId) ?? [];
      list.push(item);
      batches.set(item.batchId, list);
    } else {
      standalone.push(item);
    }
  }

  const batchGroups = [...batches.entries()]
    .map(([batchId, requests]) => ({
      batchId,
      requests: requests.sort(
        (a, b) => (a.batchRowIndex ?? 0) - (b.batchRowIndex ?? 0),
      ),
    }))
    .sort((a, b) =>
      (a.requests[0]?._id ?? "").localeCompare(b.requests[0]?._id ?? ""),
    );

  return { batchGroups, standalone };
}

function formatBatchFailures(
  failed: { fullName: string; message: string }[],
): string {
  const preview = failed
    .slice(0, 3)
    .map((f) => `${f.fullName}: ${f.message}`)
    .join("; ");
  const extra = failed.length > 3 ? ` (+${failed.length - 3} more)` : "";
  return preview + extra;
}

type RequestCardProps = {
  item: ResidentChangeRequestItem;
  nested?: boolean;
  rejectId: string | null;
  rejectReason: string;
  onRejectReasonChange: (value: string) => void;
  onStartReject: (id: string) => void;
  onCancelReject: () => void;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
};

function RequestCard({
  item,
  nested = false,
  rejectId,
  rejectReason,
  onRejectReasonChange,
  onStartReject,
  onCancelReject,
  onApprove,
  onReject,
}: RequestCardProps) {
  const type = item.requestType ?? "add";
  const prev = item.previousSnapshot;

  return (
    <Card className={nested ? "border-dashed shadow-none" : undefined}>
      <CardContent className={`space-y-2 text-sm ${nested ? "py-2" : "py-3"}`}>
        <div className="flex justify-between gap-2 flex-wrap">
          <p className="font-medium">{item.fullName}</p>
          <div className="flex gap-2">
            <Badge variant="outline">{requestTypeLabel(type)}</Badge>
            <Badge variant="secondary">{item.status}</Badge>
          </div>
        </div>
        <p className="text-muted-foreground">
          {item.community} · {item.section} · Room {item.room}
        </p>
        <p>
          {item.email} · {item.studentId}
        </p>
        {type === "update" && prev ? (
          <div className="text-xs text-muted-foreground space-y-1 border rounded-md p-2">
            <p className="font-medium text-foreground">Changes</p>
            {prev.email !== item.email ? (
              <p>
                Email: {prev.email} → {item.email}
              </p>
            ) : null}
            {prev.studentId !== item.studentId ? (
              <p>
                Student ID: {prev.studentId} → {item.studentId}
              </p>
            ) : null}
            {prev.fullName !== item.fullName ? (
              <p>
                Name: {prev.fullName} → {item.fullName}
              </p>
            ) : null}
            {prev.notes !== item.notes ? <p>Notes updated</p> : null}
          </div>
        ) : null}
        {type === "remove" && item.removalReason ? (
          <p className="text-xs">Reason: {item.removalReason}</p>
        ) : null}
        {!nested && (
          <p className="text-xs text-muted-foreground">
            Submitted by {item.submittedByEmail}
          </p>
        )}
        {rejectId === item._id ? (
          <div className="space-y-2">
            <Textarea
              placeholder="Rejection reason (optional)"
              value={rejectReason}
              onChange={(e) => onRejectReasonChange(e.target.value)}
            />
            <ConfirmActionDialog
              title="Reject this request?"
              description="The submitter will see this request as rejected."
              confirmLabel="Reject"
              destructive
              onConfirm={() => onReject(item._id)}
              trigger={
                <Button size="sm" variant="destructive">
                  Confirm reject
                </Button>
              }
            />
            <Button size="sm" variant="outline" onClick={onCancelReject}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 pt-1 flex-wrap">
            <ConfirmActionDialog
              title={`Approve ${requestTypeLabel(type).toLowerCase()}?`}
              description={approveDescription(item)}
              confirmLabel="Approve"
              onConfirm={() => onApprove(item._id)}
              trigger={<Button size="sm">Approve</Button>}
            />
            <Button size="sm" variant="outline" onClick={() => onStartReject(item._id)}>
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type BatchGroupCardProps = {
  batchId: string;
  requests: ResidentChangeRequestItem[];
  expanded: boolean;
  onToggle: () => void;
  rejectBatchId: string | null;
  rejectReason: string;
  onRejectReasonChange: (value: string) => void;
  onStartRejectBatch: (batchId: string) => void;
  onCancelRejectBatch: () => void;
  onApproveBatch: (batchId: string) => Promise<void>;
  onRejectBatch: (batchId: string) => Promise<void>;
  rejectId: string | null;
  onStartReject: (id: string) => void;
  onCancelReject: () => void;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
};

function BatchGroupCard({
  batchId,
  requests,
  expanded,
  onToggle,
  rejectBatchId,
  rejectReason,
  onRejectReasonChange,
  onStartRejectBatch,
  onCancelRejectBatch,
  onApproveBatch,
  onRejectBatch,
  rejectId,
  onStartReject,
  onCancelReject,
  onApprove,
  onReject,
}: BatchGroupCardProps) {
  const submitter = requests[0]?.submittedByEmail ?? "Unknown";
  const community = requests[0]?.community ?? "";
  const addCount = requests.filter((r) => (r.requestType ?? "add") === "add")
    .length;

  return (
    <Card>
      <CardContent className="py-3 space-y-3 text-sm">
        <div className="flex justify-between gap-2 flex-wrap items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium">Bulk upload</p>
              <Badge variant="outline">Add</Badge>
              <Badge variant="secondary">{requests.length} pending</Badge>
            </div>
            <p className="text-muted-foreground">
              {community} · {addCount} resident{addCount === 1 ? "" : "s"}
            </p>
            <p className="text-xs text-muted-foreground">
              Submitted by {submitter} · batch {batchId.slice(0, 8)}…
            </p>
          </div>
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            {expanded ? "Hide" : "Show"} residents
          </button>
        </div>

        {rejectBatchId === batchId ? (
          <div className="space-y-2 border-t pt-3">
            <Textarea
              placeholder="Rejection reason for entire batch (optional)"
              value={rejectReason}
              onChange={(e) => onRejectReasonChange(e.target.value)}
            />
            <ConfirmActionDialog
              title="Reject entire batch?"
              description={`Reject all ${requests.length} pending requests from this bulk upload?`}
              confirmLabel="Reject batch"
              destructive
              onConfirm={() => onRejectBatch(batchId)}
              trigger={
                <Button size="sm" variant="destructive">
                  Confirm reject batch
                </Button>
              }
            />
            <Button size="sm" variant="outline" onClick={onCancelRejectBatch}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap border-t pt-3">
            <ConfirmActionDialog
              title="Approve entire batch?"
              description={`Add all ${requests.length} residents from this bulk upload? Rows that fail validation (duplicates, full rooms, etc.) will be skipped and reported.`}
              confirmLabel="Approve batch"
              onConfirm={() => onApproveBatch(batchId)}
              trigger={<Button size="sm">Approve batch</Button>}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStartRejectBatch(batchId)}
            >
              Reject batch
            </Button>
          </div>
        )}

        {expanded && (
          <div className="space-y-2 pl-2 border-l-2 border-muted">
            {requests.map((r) => (
              <RequestCard
                key={r._id}
                item={r}
                nested
                rejectId={rejectId}
                rejectReason={rejectReason}
                onRejectReasonChange={onRejectReasonChange}
                onStartReject={onStartReject}
                onCancelReject={onCancelReject}
                onApprove={onApprove}
                onReject={onReject}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminResidentRequestsPage() {
  const { show } = useNotification();
  const [items, setItems] = useState<ResidentChangeRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectBatchId, setRejectBatchId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(
    () => new Set(),
  );

  const { batchGroups, standalone } = useMemo(
    () => groupRequests(items),
    [items],
  );

  const load = useCallback(async () => {
    const res = await apiFetch(
      "api/admin/resident-requests?status=pending&limit=100",
      { method: "GET" },
    );
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function clearRejectState() {
    setRejectId(null);
    setRejectBatchId(null);
    setRejectReason("");
  }

  async function approve(id: string) {
    const res = await apiFetch(`api/admin/resident-requests/${id}/approve`, {
      method: "POST",
    });
    const json = await res.json();
    if (!res.ok) {
      show({
        msg: json.msg ?? "Approve failed",
        type: "error",
        duration: null,
        closable: true,
      });
      throw new Error(json.msg);
    }
    show({ msg: "Request approved", type: "success", duration: 2000 });
    await load();
  }

  async function reject(id: string) {
    const res = await apiFetch(`api/admin/resident-requests/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason }),
    });
    const json = await res.json();
    if (!res.ok) {
      show({
        msg: json.msg ?? "Reject failed",
        type: "error",
        duration: null,
        closable: true,
      });
      throw new Error(json.msg);
    }
    clearRejectState();
    show({ msg: "Request rejected", type: "success", duration: 2000 });
    await load();
  }

  async function approveBatch(batchId: string) {
    const res = await apiFetch(
      `api/admin/resident-requests/batches/${batchId}/approve`,
      { method: "POST" },
    );
    const json = await res.json();
    if (!res.ok) {
      show({
        msg: json.msg ?? "Batch approve failed",
        type: "error",
        duration: null,
        closable: true,
      });
      throw new Error(json.msg);
    }

    const failed = (json.failed ?? []) as {
      fullName: string;
      message: string;
    }[];
    const approved = json.approved ?? 0;

    if (failed.length > 0) {
      show({
        msg: `${approved} approved, ${failed.length} failed. ${formatBatchFailures(failed)}`,
        type: "error",
        duration: null,
        closable: true,
      });
    } else {
      show({
        msg: `${approved} request${approved === 1 ? "" : "s"} approved`,
        type: "success",
        duration: 3000,
      });
    }

    await load();
  }

  async function rejectBatch(batchId: string) {
    const res = await apiFetch(
      `api/admin/resident-requests/batches/${batchId}/reject`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      },
    );
    const json = await res.json();
    if (!res.ok) {
      show({
        msg: json.msg ?? "Batch reject failed",
        type: "error",
        duration: null,
        closable: true,
      });
      throw new Error(json.msg);
    }
    clearRejectState();
    show({
      msg: `${json.rejected ?? 0} request${json.rejected === 1 ? "" : "s"} rejected`,
      type: "success",
      duration: 3000,
    });
    await load();
  }

  function toggleBatch(batchId: string) {
    setExpandedBatches((prev) => {
      const next = new Set(prev);
      if (next.has(batchId)) next.delete(batchId);
      else next.add(batchId);
      return next;
    });
  }

  if (loading) return <ListSkeleton rows={5} />;

  return (
    <div className="flex flex-col h-full space-y-4 pb-4 mx-3">
      <div>
        <h1 className="text-xl font-semibold">Resident change requests</h1>
        <p className="text-sm text-muted-foreground">
          Pending additions, updates, and removals from Area Directors
        </p>
      </div>

      {items.length === 0 ? (
        <Empty message="No pending requests" />
      ) : (
        <div className="space-y-3">
          {batchGroups.map(({ batchId, requests }) => (
            <BatchGroupCard
              key={batchId}
              batchId={batchId}
              requests={requests}
              expanded={expandedBatches.has(batchId)}
              onToggle={() => toggleBatch(batchId)}
              rejectBatchId={rejectBatchId}
              rejectReason={rejectReason}
              onRejectReasonChange={setRejectReason}
              onStartRejectBatch={(id) => {
                setRejectId(null);
                setRejectBatchId(id);
                setRejectReason("");
              }}
              onCancelRejectBatch={clearRejectState}
              onApproveBatch={approveBatch}
              onRejectBatch={rejectBatch}
              rejectId={rejectId}
              onStartReject={(id) => {
                setRejectBatchId(null);
                setRejectId(id);
                setRejectReason("");
              }}
              onCancelReject={clearRejectState}
              onApprove={approve}
              onReject={reject}
            />
          ))}

          {standalone.map((r) => (
            <RequestCard
              key={r._id}
              item={r}
              rejectId={rejectId}
              rejectReason={rejectReason}
              onRejectReasonChange={setRejectReason}
              onStartReject={(id) => {
                setRejectBatchId(null);
                setRejectId(id);
                setRejectReason("");
              }}
              onCancelReject={clearRejectState}
              onApprove={approve}
              onReject={reject}
            />
          ))}
        </div>
      )}

      <Button asChild variant="link" className="px-0">
        <Link href="/admin/dashboard">Back to overview</Link>
      </Button>
    </div>
  );
}
