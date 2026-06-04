"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ListSkeleton from "@/components/housing/ListSkeleton";
import ResidentProfileForm, {
  residentToFormValues,
} from "@/components/housing/ResidentProfileForm";
import ConfirmActionDialog from "@/components/housing/ConfirmActionDialog";
import { useNotification } from "@/context/notification-context";
import type { ResidentWithStaff } from "@/types/admin";
import type { ResidentRequestListItem } from "@/types/ga";

export default function GAResidentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { show } = useNotification();
  const [resident, setResident] = useState<ResidentWithStaff | null>(null);
  const [pendingRequest, setPendingRequest] =
    useState<ResidentRequestListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState<ReturnType<typeof residentToFormValues> | null>(
    null,
  );

  const load = useCallback(async () => {
    const [resRes, reqRes] = await Promise.all([
      apiFetch(`api/ga/residents/${id}`, { method: "GET" }),
      apiFetch(
        "api/ga/resident-requests?status=pending&limit=50",
        { method: "GET" },
      ),
    ]);
    const resData = await resRes.json();
    const reqData = await reqRes.json();
    if (resRes.ok) setResident(resData.resident);
    const pending = (reqData.items ?? []).find(
      (r: ResidentRequestListItem) =>
        r.status === "pending" &&
        String(r.residentId) === id &&
        (r.requestType === "update" || r.requestType === "remove"),
    );
    setPendingRequest(pending ?? null);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  async function submitUpdateRequest(
    values: ReturnType<typeof residentToFormValues>,
  ) {
    const res = await apiFetch("api/ga/resident-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestType: "update",
        residentId: id,
        ...values,
        fullName: `${values.firstName} ${values.lastName}`.trim(),
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      show({
        msg: json.msg ?? "Submit failed",
        type: "error",
        closable: true,
        duration: null,
      });
      throw new Error(json.msg);
    }
    show({
      msg: "Update submitted for admin approval",
      type: "success",
      duration: 3000,
    });
    setEditOpen(false);
    setDraft(null);
    await load();
  }

  async function submitRemoveRequest() {
    const res = await apiFetch("api/ga/resident-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestType: "remove",
        residentId: id,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      show({
        msg: json.msg ?? "Submit failed",
        type: "error",
        closable: true,
        duration: null,
      });
      throw new Error(json.msg);
    }
    show({
      msg: "Removal submitted for admin approval",
      type: "success",
      duration: 3000,
    });
    await load();
  }

  if (loading) return <ListSkeleton rows={3} />;
  if (!resident) {
    return <p className="text-sm text-muted-foreground">Resident not found.</p>;
  }

  const hasPending = !!pendingRequest;

  return (
    <div className="flex flex-col space-y-4 pb-4 mx-3 h-full">
      <Link
        href="/ga/dashboard/residents"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Residents
      </Link>

      <div>
        <h1 className="text-xl font-semibold">{resident.fullName}</h1>
        <p className="text-sm text-muted-foreground">
          {resident.community} · {resident.section} · Room {resident.room}
        </p>
      </div>

      {hasPending ? (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          A pending {pendingRequest?.requestType ?? "change"} request is awaiting
          admin approval.{" "}
          <Link
            href="/ga/dashboard/residents/requests"
            className="underline"
          >
            View requests
          </Link>
        </p>
      ) : null}

      <Card>
        <CardContent className="py-4 space-y-2 text-sm">
          <p>
            <span className="font-medium">Email:</span> {resident.email}
          </p>
          <p>
            <span className="font-medium">Student ID:</span>{" "}
            {resident.studentId}
          </p>
          {resident.raEmail ? (
            <p>
              <span className="font-medium">RA:</span> {resident.raEmail}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {!hasPending && !editOpen ? (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setEditOpen(true)}
        >
          Request information update
        </Button>
      ) : null}

      {editOpen && !hasPending ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Request update</CardTitle>
          </CardHeader>
          <CardContent>
            <ResidentProfileForm
              initial={residentToFormValues(resident)}
              placementLabel="Room and section cannot be changed here. Contact an administrator to move a resident."
              submitLabel="Continue"
              onSubmit={async (values) => setDraft(values)}
            />
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditOpen(false);
                  setDraft(null);
                }}
              >
                Cancel
              </Button>
              {draft ? (
                <ConfirmActionDialog
                  title="Submit update for approval?"
                  description="An administrator must approve these changes before they take effect."
                  confirmLabel="Submit"
                  onConfirm={() => submitUpdateRequest(draft)}
                  trigger={<Button className="flex-1">Confirm submit</Button>}
                />
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!hasPending ? (
        <ConfirmActionDialog
          title="Request resident removal?"
          description="Submit a removal request for admin approval. The resident will not be deleted until approved."
          confirmLabel="Submit removal request"
          destructive
          onConfirm={submitRemoveRequest}
          trigger={
            <Button variant="destructive" className="w-full">
              Request removal
            </Button>
          }
        />
      ) : null}
    </div>
  );
}
