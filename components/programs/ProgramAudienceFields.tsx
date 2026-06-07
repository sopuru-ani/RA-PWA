"use client";

import { useCallback, useEffect, useState } from "react";
import { Toggle } from "@/components/ui/toggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import ListSearchInput from "@/components/housing/ListSearchInput";
import ListSkeleton from "@/components/housing/ListSkeleton";
import { roleLabelShort } from "@/lib/role-labels";
import { cn } from "@/lib/utils";
import { fetchAudienceCandidates } from "@/lib/programs-api";
import type { AudienceCandidate, ProgramAudienceType } from "@/types/programs";

type StaffRole = "RA" | "GA" | "SA";

type Props = {
  audienceType: ProgramAudienceType;
  departmentWide: boolean;
  communityFilter?: string;
  availableCommunities: string[];
  selectedUserIds: string[];
  onSelectedUserIdsChange: (ids: string[]) => void;
  selectedCommunities: string[];
  onSelectedCommunitiesChange: (communities: string[]) => void;
  selectedRoles: StaffRole[];
  onSelectedRolesChange: (roles: StaffRole[]) => void;
  validationError?: string | null;
};

const STAFF_ROLES: StaffRole[] = ["RA", "GA", "SA"];

function helperText(
  audienceType: ProgramAudienceType,
  departmentWide: boolean,
  communityFilter?: string,
): string | null {
  switch (audienceType) {
    case "all_staff":
      return departmentWide
        ? "All active staff across the department will be invited."
        : communityFilter
          ? `All active staff in ${communityFilter} will be invited.`
          : "All active staff in the selected community will be invited.";
    case "all_ras":
      return departmentWide
        ? "All active RAs across the department will be invited."
        : communityFilter
          ? `All active RAs in ${communityFilter} will be invited.`
          : "All active RAs in the selected community will be invited.";
    case "all_gas":
      return departmentWide
        ? "All active area directors across the department will be invited."
        : communityFilter
          ? `All active area directors in ${communityFilter} will be invited.`
          : "All active area directors in the selected community will be invited.";
    default:
      return null;
  }
}

function toggleInList<T extends string>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

type SelectableRowProps = {
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
};

function SelectableRow({ checked, onChange, children }: SelectableRowProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 transition-colors",
        checked ? "bg-muted/70" : "hover:bg-muted/40",
      )}
    >
      <input
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 accent-primary"
        checked={checked}
        onChange={onChange}
      />
      <span className="min-w-0 text-sm leading-snug">{children}</span>
    </label>
  );
}

export default function ProgramAudienceFields({
  audienceType,
  departmentWide,
  communityFilter,
  availableCommunities,
  selectedUserIds,
  onSelectedUserIdsChange,
  selectedCommunities,
  onSelectedCommunitiesChange,
  selectedRoles,
  onSelectedRolesChange,
  validationError,
}: Props) {
  const [candidates, setCandidates] = useState<AudienceCandidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [candidateError, setCandidateError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadCandidates = useCallback(async () => {
    if (!departmentWide && !communityFilter) {
      setCandidates([]);
      setCandidateError(null);
      setLoadingCandidates(false);
      return;
    }

    setLoadingCandidates(true);
    setCandidateError(null);
    try {
      const data = await fetchAudienceCandidates({
        community: departmentWide ? undefined : communityFilter,
        q: debouncedSearch || undefined,
        limit: 500,
      });
      setCandidates(data);
    } catch (err) {
      setCandidateError(
        err instanceof Error ? err.message : "Failed to load staff",
      );
      setCandidates([]);
    } finally {
      setLoadingCandidates(false);
    }
  }, [communityFilter, departmentWide, debouncedSearch]);

  useEffect(() => {
    if (audienceType !== "selected_users") return;
    loadCandidates();
  }, [audienceType, loadCandidates]);

  const hint = helperText(audienceType, departmentWide, communityFilter);
  const showPanel =
    hint ||
    audienceType === "selected_users" ||
    audienceType === "selected_communities" ||
    audienceType === "community_staff";

  if (!showPanel && !validationError) {
    return null;
  }

  return (
    <div className="space-y-4">
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}

      {audienceType === "selected_users" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Select staff</p>
            {selectedUserIds.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {selectedUserIds.length} selected
              </span>
            )}
          </div>
          <ListSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name or email..."
          />
          {candidateError && (
            <p className="text-sm text-destructive">{candidateError}</p>
          )}
          {loadingCandidates ? (
            <ListSkeleton rows={4} />
          ) : !departmentWide && !communityFilter ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Select a community above to load staff.
            </p>
          ) : candidates.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No staff found
              {communityFilter && !departmentWide
                ? ` in ${communityFilter}`
                : ""}
              .
            </p>
          ) : (
            <ScrollArea className="h-52 rounded-md bg-muted/30">
              <div className="space-y-0.5 p-1">
                {candidates.map((c) => {
                  const checked = selectedUserIds.includes(c.id);
                  const label = c.fullName?.trim() || c.email;
                  return (
                    <SelectableRow
                      key={c.id}
                      checked={checked}
                      onChange={() =>
                        onSelectedUserIdsChange(
                          toggleInList(selectedUserIds, c.id),
                        )
                      }
                    >
                      <span className="font-medium">{label}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        · {roleLabelShort(c.role)}
                        {c.fullName ? ` · ${c.email}` : ""}
                      </span>
                    </SelectableRow>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      )}

      {audienceType === "selected_communities" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Select communities</p>
            {selectedCommunities.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {selectedCommunities.length} selected
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            All RA, area director, and SA staff in the chosen communities will
            be invited.
          </p>
          <div className="space-y-0.5 rounded-md bg-muted/30 p-1">
            {availableCommunities.map((c) => {
              const checked = selectedCommunities.includes(c);
              return (
                <SelectableRow
                  key={c}
                  checked={checked}
                  onChange={() =>
                    onSelectedCommunitiesChange(
                      toggleInList(selectedCommunities, c),
                    )
                  }
                >
                  {c}
                </SelectableRow>
              );
            })}
          </div>
        </div>
      )}

      {audienceType === "community_staff" && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Staff roles</p>
          <p className="text-sm text-muted-foreground">
            {departmentWide
              ? "Invite staff with these roles across the department."
              : communityFilter
                ? `Invite staff with these roles in ${communityFilter}.`
                : "Invite staff with these roles in the selected community."}
          </p>
          <div className="flex flex-wrap gap-2">
            {STAFF_ROLES.map((role) => (
              <Toggle
                key={role}
                pressed={selectedRoles.includes(role)}
                onPressedChange={(pressed) => {
                  if (pressed) {
                    onSelectedRolesChange([...selectedRoles, role]);
                  } else {
                    onSelectedRolesChange(
                      selectedRoles.filter((r) => r !== role),
                    );
                  }
                }}
                aria-label={`Include ${role}`}
                size="sm"
                className="min-w-[4.5rem]"
              >
                {role === "GA" ? roleLabelShort("GA") : role}
              </Toggle>
            ))}
          </div>
        </div>
      )}

      {validationError && (
        <p className="text-sm text-destructive">{validationError}</p>
      )}
    </div>
  );
}
