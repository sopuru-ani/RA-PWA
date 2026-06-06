"use client";

import { useState } from "react";
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
import type {
  CreateProgramInput,
  ProgramAudienceType,
  ProgramCategory,
} from "@/types/programs";

type Props = {
  initial?: Partial<CreateProgramInput> & {
    startDate?: string;
    endDate?: string;
  };
  availableCommunities: string[];
  allowDepartmentWide?: boolean;
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

function defaultStart() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: "18:00",
  };
}

export default function ProgramForm({
  initial,
  availableCommunities,
  allowDepartmentWide = true,
  loading,
  submitLabel = "Save draft",
  excludeProgramId,
  onSubmit,
}: Props) {
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
  const [audienceType, setAudienceType] = useState<ProgramAudienceType>(
    initial?.audience?.type ?? "community_staff",
  );
  const [selectedCommunity, setSelectedCommunity] = useState(
    initial?.communities?.[0] ?? availableCommunities[0] ?? "",
  );
  const [departmentWide, setDepartmentWide] = useState(
    (initial?.communities?.length ?? 0) === 0 && allowDepartmentWide,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const communities =
      departmentWide && allowDepartmentWide
        ? []
        : selectedCommunity
          ? [selectedCommunity]
          : availableCommunities.slice(0, 1);

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
      audience: { type: audienceType },
    });
  }

  const conflictStart = toIsoFromLocal(startDate, startTime);
  const conflictEnd = toIsoFromLocal(endDate, endTime);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ProgramConflictAlert
        startDate={conflictStart}
        endDate={conflictEnd}
        excludeProgramId={excludeProgramId}
      />

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
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

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Optional"
        />
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={category} onValueChange={(v) => setCategory(v as ProgramCategory)}>
          <SelectTrigger>
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

      <div className="space-y-2">
        <Label>Audience</Label>
        <Select
          value={audienceType}
          onValueChange={(v) => setAudienceType(v as ProgramAudienceType)}
        >
          <SelectTrigger>
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

      {allowDepartmentWide && (
        <div className="flex items-center gap-2">
          <Toggle
            pressed={departmentWide}
            onPressedChange={setDepartmentWide}
            aria-label="Department-wide program"
          >
            Dept-wide
          </Toggle>
          <span className="text-sm text-muted-foreground">
            Invite across the entire department
          </span>
        </div>
      )}

      {!departmentWide && availableCommunities.length > 0 && (
        <div className="space-y-2">
          <Label>Community</Label>
          <Select
            value={selectedCommunity}
            onValueChange={setSelectedCommunity}
          >
            <SelectTrigger>
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

      <div className="flex items-center gap-2">
        <Toggle
          pressed={requiredAttendance}
          onPressedChange={setRequiredAttendance}
          aria-label="Required attendance"
        >
          Required
        </Toggle>
        <span className="text-sm text-muted-foreground">
          Mark attendance as mandatory
        </span>
      </div>

      <Button type="submit" disabled={loading} className="w-full text-white">
        {loading ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
