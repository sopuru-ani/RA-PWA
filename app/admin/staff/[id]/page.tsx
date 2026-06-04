"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import ListSkeleton from "@/components/housing/ListSkeleton";
import StaffForm, { type StaffFormValues } from "@/components/admin/StaffForm";
import { useNotification } from "@/context/notification-context";
import { roleLabelShort } from "@/lib/role-labels";

type StaffDetail = {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  status: string;
  isActive: boolean;
  communities: string[];
  assignments: string[];
  notes?: string;
  studentId?: string;
  sectionAssignments?: {
    community: string;
    section: string;
    raEmail: string;
    gaEmail: string;
  }[];
};

export default function AdminStaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { show } = useNotification();
  const id = params.id as string;

  const [source, setSource] = useState<"user" | "authorized">("user");
  const [staff, setStaff] = useState<StaffDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await apiFetch(`api/admin/staff/${id}`, { method: "GET" });
    const data = await res.json();
    if (res.ok) {
      setSource(data.source);
      setStaff(data.staff);
    } else {
      setStaff(null);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  async function handleRevokeOrDeactivate() {
    setActionLoading(true);
    try {
      const res = await apiFetch(`api/admin/staff/${id}`, { method: "DELETE" });
      const result = await res.json().catch(() => ({}));
      if (res.ok) {
        show({
          msg: result.msg ?? "Done",
          duration: 1500,
          type: "success",
        });
        router.push("/admin/staff");
      } else {
        show({
          msg: result.msg ?? "Action failed",
          type: "error",
          closable: true,
          duration: null,
        });
      }
    } catch {
      show({
        msg: "Network or server error",
        type: "error",
        closable: true,
        duration: null,
      });
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <ListSkeleton rows={3} />;
  if (!staff) {
    return (
      <p className="text-sm text-muted-foreground">Staff member not found.</p>
    );
  }

  const formInitial: StaffFormValues = {
    email: staff.email,
    role: staff.role,
    isActive: staff.isActive,
    community: staff.communities[0] ?? "",
    assignment: staff.assignments[0] ?? "",
    notes: staff.notes ?? "",
  };

  const destructiveLabel =
    source === "authorized" ? "Revoke invite" : "Deactivate account";
  const destructiveDescription =
    source === "authorized"
      ? "This removes the invite. They will not be able to sign up with this email unless you invite them again."
      : "This deactivates their account and clears their section/community assignments. They will not be able to log in.";

  return (
    <div className="space-y-4 pb-4 max-w-lg mx-3">
      <Link
        href="/admin/staff"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to staff
      </Link>

      <div>
        <h1 className="text-xl font-semibold">
          {staff.fullName ?? staff.email}
        </h1>
        <div className="flex gap-2 mt-2">
          <Badge>{roleLabelShort(staff.role)}</Badge>
          <Badge variant="outline">{staff.status}</Badge>
        </div>
      </div>

      {staff.studentId ? (
        <Card>
          <CardContent className="py-3 text-sm">
            <span className="font-medium">Student ID:</span> {staff.studentId}
          </CardContent>
        </Card>
      ) : null}

      <div>
        <h2 className="text-sm font-medium mb-2">Edit assignment</h2>
        <StaffForm
          mode="edit"
          staffId={id}
          source={source}
          initial={formInitial}
          onSaved={() => load()}
        />
      </div>

      {staff.sectionAssignments && staff.sectionAssignments.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Linked sections</p>
          {staff.sectionAssignments.map((s) => (
            <Card key={`${s.community}-${s.section}`}>
              <CardContent className="py-3 text-sm">
                <p>
                  {s.community} — Section {s.section}
                </p>
                <p className="text-muted-foreground">RA: {s.raEmail}</p>
                <p className="text-muted-foreground">
                  Area Director: {s.gaEmail}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="w-full" disabled={actionLoading}>
            {destructiveLabel}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{destructiveLabel}?</AlertDialogTitle>
            <AlertDialogDescription>{destructiveDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleRevokeOrDeactivate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
