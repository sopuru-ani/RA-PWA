"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ListSkeleton from "@/components/housing/ListSkeleton";
import EntityNotFound from "@/components/housing/EntityNotFound";
import ResidentProfileForm, {
  residentToFormValues,
} from "@/components/housing/ResidentProfileForm";
import ResidentMoveForm from "@/components/housing/ResidentMoveForm";
import ConfirmActionDialog from "@/components/housing/ConfirmActionDialog";
import { useNotification } from "@/context/notification-context";
import type { ResidentWithStaff } from "@/types/admin";

export default function AdminResidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { show } = useNotification();
  const [resident, setResident] = useState<ResidentWithStaff | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [pendingSave, setPendingSave] = useState<
    ReturnType<typeof residentToFormValues> | null
  >(null);

  const load = useCallback(async () => {
    const res = await apiFetch(`api/admin/residents/${id}`, { method: "GET" });
    const data = await res.json();
    if (res.ok) setResident(data.resident);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  async function saveEdit(values: ReturnType<typeof residentToFormValues>) {
    const res = await apiFetch(`api/admin/residents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        fullName: `${values.firstName} ${values.lastName}`.trim(),
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      show({
        msg: json.msg ?? "Update failed",
        type: "error",
        closable: true,
        duration: null,
      });
      throw new Error(json.msg);
    }
    show({ msg: "Resident updated", type: "success", duration: 2000 });
    setEditOpen(false);
    setPendingSave(null);
    await load();
  }

  async function deleteResident() {
    const res = await apiFetch(`api/admin/residents/${id}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok) {
      show({
        msg: json.msg ?? "Delete failed",
        type: "error",
        closable: true,
        duration: null,
      });
      throw new Error(json.msg);
    }
    show({ msg: "Resident removed", type: "success", duration: 2000 });
    router.push("/admin/residents");
  }

  if (loading) return <ListSkeleton rows={3} />;
  if (!resident) {
    return (
      <EntityNotFound
        message="Resident not found"
        backHref="/admin/residents"
        backLabel="All residents"
      />
    );
  }

  return (
    <div className="flex flex-col space-y-4 pb-4 mx-3 h-full">
      <Link
        href="/admin/residents"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All residents
      </Link>

      <div>
        <h1 className="text-xl font-semibold">{resident.fullName}</h1>
        <p className="text-sm text-muted-foreground">
          {resident.community} · {resident.section} · Room {resident.room}
        </p>
      </div>

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
          {resident.gaEmail ? (
            <p>
              <span className="font-medium">Area Director:</span>{" "}
              {resident.gaEmail}
            </p>
          ) : null}
          {resident.notes ? (
            <p>
              <span className="font-medium">Notes:</span> {resident.notes}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {!editOpen ? (
        <Button variant="outline" className="w-full" onClick={() => setEditOpen(true)}>
          Edit information
        </Button>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Edit information</CardTitle>
          </CardHeader>
          <CardContent>
            <ResidentProfileForm
              initial={residentToFormValues(resident)}
              placementLabel={`Placement: ${resident.community} · ${resident.section} · Room ${resident.room} (use Move to change)`}
              submitLabel="Review changes"
              onSubmit={async (values) => {
                setPendingSave(values);
              }}
            />
            <div className="flex gap-2 mt-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              {pendingSave ? (
                <ConfirmActionDialog
                  title="Save resident changes?"
                  description="Apply these updates immediately. Placement cannot be changed here."
                  confirmLabel="Save"
                  onConfirm={() => saveEdit(pendingSave)}
                  trigger={<Button className="flex-1 text-white">Confirm save</Button>}
                />
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      {!moveOpen ? (
        <Button variant="outline" className="w-full" onClick={() => setMoveOpen(true)}>
          Move to another room
        </Button>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Move resident</CardTitle>
          </CardHeader>
          <CardContent>
            <ResidentMoveForm
              residentId={id}
              currentCommunity={resident.community}
              currentSection={resident.section}
              currentRoom={resident.room}
              onMoved={async () => {
                show({ msg: "Resident moved", type: "success", duration: 2000 });
                setMoveOpen(false);
                await load();
              }}
            />
            <Button
              variant="ghost"
              className="w-full mt-2"
              onClick={() => setMoveOpen(false)}
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}

      <ConfirmActionDialog
        title="Remove resident?"
        description="Permanently delete this resident from the system. This cannot be undone."
        confirmLabel="Remove"
        destructive
        onConfirm={deleteResident}
        trigger={
          <Button variant="destructive" className="w-full">
            Remove resident
          </Button>
        }
      />
    </div>
  );
}
