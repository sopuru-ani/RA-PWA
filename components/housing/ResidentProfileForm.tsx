"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { ResidentWithStaff } from "@/types/admin";

export type ResidentProfileFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  notes: string;
};

type Props = {
  initial: ResidentProfileFormValues;
  placementLabel?: string;
  submitLabel: string;
  onSubmit: (values: ResidentProfileFormValues) => Promise<void>;
};

export function residentToFormValues(
  resident: ResidentWithStaff,
): ResidentProfileFormValues {
  return {
    firstName: resident.firstName ?? "",
    lastName: resident.lastName ?? "",
    email: resident.email,
    studentId: resident.studentId,
    notes: resident.notes ?? "",
  };
}

export default function ResidentProfileForm({
  initial,
  placementLabel,
  submitLabel,
  onSubmit,
}: Props) {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(form);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {placementLabel ? (
        <p className="text-sm text-muted-foreground">{placementLabel}</p>
      ) : null}
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
          required
          type="email"
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
        <Label>Notes</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
      </div>
      <Button type="submit" className="w-full text-white" disabled={loading}>
        {loading ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
