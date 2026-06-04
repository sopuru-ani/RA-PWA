"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
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

export default function AdminResidentRequestsPage() {
  const { show } = useNotification();
  const [items, setItems] = useState<ResidentChangeRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async () => {
    const res = await apiFetch(
      "api/admin/resident-requests?status=pending&limit=50",
      { method: "GET" },
    );
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
    setRejectId(null);
    setRejectReason("");
    show({ msg: "Request rejected", type: "success", duration: 2000 });
    await load();
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
          {items.map((r) => {
            const type = r.requestType ?? "add";
            const prev = r.previousSnapshot;
            return (
              <Card key={r._id}>
                <CardContent className="py-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-2 flex-wrap">
                    <p className="font-medium">{r.fullName}</p>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {requestTypeLabel(type)}
                      </Badge>
                      <Badge variant="secondary">{r.status}</Badge>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    {r.community} · {r.section} · Room {r.room}
                  </p>
                  <p>
                    {r.email} · {r.studentId}
                  </p>
                  {type === "update" && prev ? (
                    <div className="text-xs text-muted-foreground space-y-1 border rounded-md p-2">
                      <p className="font-medium text-foreground">Changes</p>
                      {prev.email !== r.email ? (
                        <p>
                          Email: {prev.email} → {r.email}
                        </p>
                      ) : null}
                      {prev.studentId !== r.studentId ? (
                        <p>
                          Student ID: {prev.studentId} → {r.studentId}
                        </p>
                      ) : null}
                      {prev.fullName !== r.fullName ? (
                        <p>
                          Name: {prev.fullName} → {r.fullName}
                        </p>
                      ) : null}
                      {prev.notes !== r.notes ? (
                        <p>Notes updated</p>
                      ) : null}
                    </div>
                  ) : null}
                  {type === "remove" && r.removalReason ? (
                    <p className="text-xs">Reason: {r.removalReason}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    Submitted by {r.submittedByEmail}
                    {r.batchId ? ` · batch ${r.batchId.slice(0, 8)}…` : ""}
                  </p>
                  {rejectId === r._id ? (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Rejection reason (optional)"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                      <ConfirmActionDialog
                        title="Reject this request?"
                        description="The submitter will see this request as rejected."
                        confirmLabel="Reject"
                        destructive
                        onConfirm={() => reject(r._id)}
                        trigger={
                          <Button size="sm" variant="destructive">
                            Confirm reject
                          </Button>
                        }
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRejectId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2 pt-1 flex-wrap">
                      <ConfirmActionDialog
                        title={`Approve ${requestTypeLabel(type).toLowerCase()}?`}
                        description={approveDescription(r)}
                        confirmLabel="Approve"
                        onConfirm={() => approve(r._id)}
                        trigger={<Button size="sm">Approve</Button>}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRejectId(r._id)}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Button asChild variant="link" className="px-0">
        <Link href="/admin/dashboard">Back to overview</Link>
      </Button>
    </div>
  );
}
