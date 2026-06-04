"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCommunityOptions } from "@/hooks/use-community-options";
import { apiFetch } from "@/lib/api-client";
import { useNotification } from "@/context/notification-context";
import { roleLabelOption } from "@/lib/role-labels";

/** Internal role values; UI labels via roleLabelOption */
const ROLES = ["RA", "GA", "SA", "Admin"] as const;

export type StaffFormValues = {
  email: string;
  role: string;
  isActive: boolean;
  community: string;
  assignment: string;
  notes: string;
};

type Props = {
  mode: "create" | "edit";
  staffId?: string;
  source?: "user" | "authorized";
  initial: StaffFormValues;
  onSaved?: () => void;
};

function StaffForm({ mode, staffId, source, initial, onSaved }: Props) {
  const { show } = useNotification();
  const { communities, loading: communitiesLoading, error: communitiesError } =
    useCommunityOptions();

  const [email, setEmail] = useState(initial.email);
  const [role, setRole] = useState(initial.role);
  const [isActive, setIsActive] = useState(initial.isActive);
  const [community, setCommunity] = useState(initial.community);
  const [assignment, setAssignment] = useState(initial.assignment);
  const [notes, setNotes] = useState(initial.notes);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setEmail(initial.email);
    setRole(initial.role);
    setIsActive(initial.isActive);
    setCommunity(initial.community);
    setAssignment(initial.assignment);
    setNotes(initial.notes);
  }, [initial]);

  const selectedCommunity = communities.find((c) => c.name === community);
  const sections = selectedCommunity?.sections ?? [];

  useEffect(() => {
    if (assignment && sections.length > 0 && !sections.includes(assignment)) {
      setAssignment("");
    }
  }, [community, sections, assignment]);

  function buildBody(): Record<string, unknown> {
    const body: Record<string, unknown> = {
      isActive,
      notes: notes || undefined,
    };

    if (mode === "create") {
      body.email = email;
      body.role = role;
    }

    if (role !== "Admin") {
      body.community = community ? [community] : [];
    } else {
      body.community = [];
      body.assignment = [];
    }

    if (role === "RA") {
      body.assignment = assignment ? [assignment] : [];
    } else {
      body.assignment = [];
    }

    return body;
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const body = buildBody();
      const url =
        mode === "create" ? "api/admin/staff" : `api/admin/staff/${staffId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await apiFetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok) {
        show({
          msg: result.msg ?? "Saved",
          duration: 1500,
          type: "success",
        });
        onSaved?.();
      } else {
        show({
          msg: result.msg ?? "Could not save",
          type: "error",
          closable: true,
          duration: null,
        });
      }
    } catch {
      show({
        msg: "Network or server error. Please try again.",
        type: "error",
        closable: true,
        duration: null,
      });
    } finally {
      setSubmitting(false);
    }
  }

  const emailLocked = mode === "edit";
  const roleLocked = mode === "edit";

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="staff-email">Email</Label>
        <Input
          id="staff-email"
          type="email"
          value={email}
          disabled={emailLocked}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <Label>Role</Label>
        <Select
          value={role}
          onValueChange={setRole}
          disabled={roleLocked}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {roleLabelOption(r)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>Status</Label>
        <RadioGroup
          value={String(isActive)}
          onValueChange={(v) => setIsActive(v === "true")}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <RadioGroupItem id="staff-active" value="true" />
              <label htmlFor="staff-active">
                {source === "authorized" ? "Active invite" : "Active"}
              </label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="staff-inactive" value="false" />
              <label htmlFor="staff-inactive">Inactive</label>
            </div>
          </div>
        </RadioGroup>
      </div>

      {role !== "Admin" ? (
        <div className="space-y-1">
          <Label>Community</Label>
          {communitiesLoading ? (
            <p className="text-sm text-muted-foreground">Loading communities...</p>
          ) : communitiesError ? (
            <p className="text-sm text-destructive">{communitiesError}</p>
          ) : communities.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No communities in the database yet.
            </p>
          ) : (
            <Select value={community} onValueChange={setCommunity}>
              <SelectTrigger>
                <SelectValue placeholder="Select community" />
              </SelectTrigger>
              <SelectContent>
                {communities.map((c) => (
                  <SelectItem key={c.name} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      ) : null}

      {role === "RA" ? (
        <div className="space-y-1">
          <Label>Section</Label>
          {!community ? (
            <p className="text-sm text-muted-foreground">
              Select a community first
            </p>
          ) : sections.length === 0 ? (
            <Input
              value={assignment}
              onChange={(e) => setAssignment(e.target.value)}
              placeholder="Section name"
            />
          ) : (
            <Select value={assignment} onValueChange={setAssignment}>
              <SelectTrigger>
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      ) : null}

      {(mode === "create" || source === "authorized") && (
        <div className="space-y-1">
          <Label htmlFor="staff-notes">
            Notes <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="staff-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      )}

      <Button
        className="w-full text-white"
        disabled={
          submitting ||
          (mode === "create" && !email) ||
          (role !== "Admin" && !community) ||
          (role === "RA" && !assignment)
        }
        onClick={() => handleSubmit()}
      >
        {submitting ? "Saving..." : mode === "create" ? "Create invite" : "Save changes"}
      </Button>
    </div>
  );
}

export default StaffForm;
