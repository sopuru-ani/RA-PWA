"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import {
  AUDIENCE_TYPE_LABELS,
  PROGRAM_CATEGORY_LABELS,
} from "@/lib/program-labels";
import { toIsoFromLocal } from "@/lib/programs-api";
import ProgramConflictAlert from "@/components/programs/ProgramConflictAlert";
import ProgramAudienceFields from "@/components/programs/ProgramAudienceFields";
import type {
  CreateProgramInput,
  ProgramAudience,
  ProgramAudienceType,
  ProgramCategory,
} from "@/types/programs";

type Props = {
  initial?: Partial<CreateProgramInput> & {
    startDate?: string;
    endDate?: string;
  };
  availableCommunities: string[];
  loading?: boolean;
  submitLabel?: string;
  excludeProgramId?: string;
  onSubmit: (input: CreateProgramInput) => Promise<void>;
};

const CATEGORIES = Object.keys(
  PROGRAM_CATEGORY_LABELS,
) as ProgramCategory[];

const AUDIENCE_TYPES = Object.keys(
  AUDIENCE_TYPE_LABELS,
) as ProgramAudienceType[];

const DEFAULT_ROLES: ("RA" | "GA" | "SA")[] = ["RA", "GA", "SA"];

function defaultStart() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: "18:00",
  };
}

function validateAudience(
  audienceType: ProgramAudienceType,
  selectedUserIds: string[],
  selectedCommunities: string[],
  selectedRoles: ("RA" | "GA" | "SA")[],
): string | null {
  if (audienceType === "selected_users" && selectedUserIds.length === 0) {
    return "Select at least one staff member.";
  }
  if (
    audienceType === "selected_communities" &&
    selectedCommunities.length === 0
  ) {
    return "Select at least one community.";
  }
  if (audienceType === "community_staff" && selectedRoles.length === 0) {
    return "Select at least one staff role.";
  }
  return null;
}

function buildAudiencePayload(
  audienceType: ProgramAudienceType,
  selectedUserIds: string[],
  selectedRoles: ("RA" | "GA" | "SA")[],
): ProgramAudience {
  const audience: ProgramAudience = { type: audienceType };
  if (audienceType === "selected_users") {
    audience.userIds = selectedUserIds;
  }
  if (audienceType === "community_staff") {
    audience.roles = selectedRoles;
  }
  return audience;
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-0.5">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

type OptionRowProps = {
  label: string;
  description: string;
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  ariaLabel: string;
};

function OptionRow({
  label,
  description,
  pressed,
  onPressedChange,
  ariaLabel,
}: OptionRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium leading-none">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Toggle
        pressed={pressed}
        onPressedChange={onPressedChange}
        aria-label={ariaLabel}
        className="shrink-0 min-w-[3.25rem]"
      >
        {pressed ? "On" : "Off"}
      </Toggle>
    </div>
  );
}

export default function ProgramForm({
  initial,
  availableCommunities,
  loading,
  submitLabel = "Save draft",
  excludeProgramId,
  onSubmit,
}: Props) {
  const initialAudienceType =
    initial?.audience?.type ?? ("community_staff" as ProgramAudienceType);
  const startDefault = defaultStart();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [startDate, setStartDate] = useState(
    initial?.startDate
      ? initial.startDate.slice(0, 10)
      : startDefault.date,
  );
  const [startTime, setStartTime] = useState(
    initial?.startDate ? initial.startDate.slice(11, 16) : startDefault.time,
  );
  const [endDate, setEndDate] = useState(
    initial?.endDate ? initial.endDate.slice(0, 10) : startDefault.date,
  );
  const [endTime, setEndTime] = useState(
    initial?.endDate ? initial.endDate.slice(11, 16) : "19:00",
  );
  const [location, setLocation] = useState(initial?.location ?? "");
  const [category, setCategory] = useState<ProgramCategory>(
    initial?.category ?? "other",
  );
  const [requiredAttendance, setRequiredAttendance] = useState(
    initial?.requiredAttendance ?? false,
  );
  const [audienceType, setAudienceType] =
    useState<ProgramAudienceType>(initialAudienceType);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    initial?.audience?.userIds ?? [],
  );
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>(
    initialAudienceType === "selected_communities"
      ? (initial?.communities ?? [])
      : [],
  );
  const [selectedRoles, setSelectedRoles] = useState<("RA" | "GA" | "SA")[]>(
    initial?.audience?.roles?.length
      ? initial.audience.roles
      : DEFAULT_ROLES,
  );
  const [selectedCommunity, setSelectedCommunity] = useState(
    initial?.communities?.[0] ?? availableCommunities[0] ?? "",
  );
  const [departmentWide, setDepartmentWide] = useState(() => {
    if (initialAudienceType === "selected_communities") return false;
    if ((initial?.communities?.length ?? 0) > 0) return false;
    if (availableCommunities.length > 0) return false;
    return true;
  });
  const [audienceError, setAudienceError] = useState<string | null>(null);

  useEffect(() => {
    if (availableCommunities.length === 0) return;
    setSelectedCommunity((current) => {
      if (current && availableCommunities.includes(current)) return current;
      return initial?.communities?.[0] ?? availableCommunities[0];
    });
  }, [availableCommunities, initial?.communities]);

  useEffect(() => {
    if (audienceType === "selected_communities" && departmentWide) {
      setDepartmentWide(false);
    }
  }, [audienceType, departmentWide]);

  function handleAudienceTypeChange(next: ProgramAudienceType) {
    setAudienceType(next);
    setAudienceError(null);
    if (next === "selected_communities") {
      setDepartmentWide(false);
    }
  }

  function resolveCommunities(): string[] {
    if (audienceType === "selected_communities") {
      return selectedCommunities;
    }
    if (departmentWide) {
      return [];
    }
    if (selectedCommunity) {
      return [selectedCommunity];
    }
    return availableCommunities.slice(0, 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validation = validateAudience(
      audienceType,
      selectedUserIds,
      selectedCommunities,
      selectedRoles,
    );
    if (validation) {
      setAudienceError(validation);
      return;
    }
    setAudienceError(null);

    const communities = resolveCommunities();

    await onSubmit({
      title,
      description,
      startDate: toIsoFromLocal(startDate, startTime),
      endDate: toIsoFromLocal(endDate, endTime),
      location: location || undefined,
      category,
      requiredAttendance,
      visibility: departmentWide ? "department" : "community",
      communities,
      audience: buildAudiencePayload(
        audienceType,
        selectedUserIds,
        selectedRoles,
      ),
    });
  }

  const conflictStart = toIsoFromLocal(startDate, startTime);
  const conflictEnd = toIsoFromLocal(endDate, endTime);
  const showSingleCommunity =
    !departmentWide &&
    availableCommunities.length > 0 &&
    audienceType !== "selected_communities";
  const communityFilter = departmentWide ? undefined : selectedCommunity;
  const showScopePanel =
    audienceType !== "selected_communities" && availableCommunities.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <ProgramConflictAlert
        startDate={conflictStart}
        endDate={conflictEnd}
        excludeProgramId={excludeProgramId}
      />

      <FormSection title="Program details">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Welcome week social"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will happen, what should attendees bring, etc."
              required
              rows={4}
              className="min-h-[6rem] resize-y"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Building, room, or virtual link"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as ProgramCategory)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {PROGRAM_CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection title="Schedule">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startTime">Start time</Label>
            <Input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End date</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">End time</Label>
            <Input
              id="endTime"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Audience"
        description="Invite any staff member — pick individuals, roles, or whole communities."
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Invitation type</Label>
            <Select
              value={audienceType}
              onValueChange={(v) =>
                handleAudienceTypeChange(v as ProgramAudienceType)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCE_TYPES.map((a) => (
                  <SelectItem key={a} value={a}>
                    {AUDIENCE_TYPE_LABELS[a]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showScopePanel && (
            <div className="space-y-4">
              <p className="text-sm font-medium">Scope</p>
              <OptionRow
                label="Department-wide"
                description="Invite staff across the entire department"
                pressed={departmentWide}
                onPressedChange={setDepartmentWide}
                ariaLabel="Department-wide program"
              />
              {showSingleCommunity && (
                <div className="space-y-2">
                  <Label>Community</Label>
                  <Select
                    value={selectedCommunity}
                    onValueChange={setSelectedCommunity}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select community" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCommunities.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <ProgramAudienceFields
            audienceType={audienceType}
            departmentWide={departmentWide}
            communityFilter={communityFilter}
            availableCommunities={availableCommunities}
            selectedUserIds={selectedUserIds}
            onSelectedUserIdsChange={setSelectedUserIds}
            selectedCommunities={selectedCommunities}
            onSelectedCommunitiesChange={setSelectedCommunities}
            selectedRoles={selectedRoles}
            onSelectedRolesChange={setSelectedRoles}
            validationError={audienceError}
          />

          <OptionRow
            label="Required attendance"
            description="Staff must attend; tracked in attendance records"
            pressed={requiredAttendance}
            onPressedChange={setRequiredAttendance}
            ariaLabel="Required attendance"
          />
        </div>
      </FormSection>

      <Button type="submit" disabled={loading} className="w-full text-white">
        {loading ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
