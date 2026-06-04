"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api-client";
import { useNotification } from "@/context/notification-context";
import { useGASession } from "@/context/GASessionContext";
import { useRouter } from "next/navigation";
import ConfirmActionDialog from "@/components/housing/ConfirmActionDialog";

export default function GAAddResidentPage() {
  const { community } = useGASession();
  const { show } = useNotification();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    studentId: "",
    section: "",
    room: "",
    notes: "",
  });

  async function handleSubmit() {
    setLoading(true);
    try {
      const res = await apiFetch("api/ga/resident-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          community: community.name,
          fullName: `${form.firstName} ${form.lastName}`.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.msg ?? "Submit failed");

      show({
        msg: "Submitted for admin approval",
        type: "success",
        duration: 3000,
      });
      router.push("/ga/dashboard/residents/requests");
    } catch (err) {
      show({
        msg: err instanceof Error ? err.message : "Submit failed",
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
        href="/ga/dashboard/residents"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Residents
      </Link>

      <div>
        <h1 className="text-xl font-semibold">Add resident</h1>
        <p className="text-sm text-muted-foreground">
          {community.name} — requires admin approval
        </p>
      </div>

      <form
        onSubmit={(e) => e.preventDefault()}
        noValidate
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>First name</Label>
            <Input
              required
              value={form.firstName}
              onChange={(e) =>
                setForm((f) => ({ ...f, firstName: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label>Last name</Label>
            <Input
              required
              value={form.lastName}
              onChange={(e) =>
                setForm((f) => ({ ...f, lastName: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Email</Label>
          <Input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <Label>Student ID</Label>
          <Input
            required
            value={form.studentId}
            onChange={(e) =>
              setForm((f) => ({ ...f, studentId: e.target.value }))
            }
          />
        </div>
        <div className="space-y-1">
          <Label>Section</Label>
          <Select
            value={form.section}
            onValueChange={(v) => setForm((f) => ({ ...f, section: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select section" />
            </SelectTrigger>
            <SelectContent>
              {community.sections.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Room</Label>
          <Input
            required
            value={form.room}
            onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <Label>Notes</Label>
          <Textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>
        <ConfirmActionDialog
          title="Submit resident for approval?"
          description="An administrator must approve this addition before the resident appears in the system."
          confirmLabel="Submit"
          onConfirm={handleSubmit}
          trigger={
            <Button type="button" disabled={loading} className="w-full">
              {loading ? "Submitting..." : "Submit for approval"}
            </Button>
          }
        />
      </form>
    </div>
  );
}
