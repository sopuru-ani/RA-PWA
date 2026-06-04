"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCommunityOptions } from "@/hooks/use-community-options";
import { apiFetch } from "@/lib/api-client";
import ConfirmActionDialog from "@/components/housing/ConfirmActionDialog";

type RoomOption = {
  _id: string;
  section: string;
  room: string;
  capacity: number;
  vacancy?: number;
};

type Props = {
  residentId: string;
  currentCommunity: string;
  currentSection: string;
  currentRoom: string;
  onMoved: () => void;
};

export default function ResidentMoveForm({
  residentId,
  currentCommunity,
  currentSection,
  currentRoom,
  onMoved,
}: Props) {
  const { communities } = useCommunityOptions();
  const [community, setCommunity] = useState(currentCommunity);
  const [section, setSection] = useState(currentSection);
  const [roomId, setRoomId] = useState("");
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCommunity = communities.find((c) => c.name === community);
  const sections = selectedCommunity?.sections ?? [];

  useEffect(() => {
    if (!community || !section) {
      setRooms([]);
      setRoomId("");
      return;
    }

    let cancelled = false;
    setLoadingRooms(true);
    setError(null);

    async function loadRooms() {
      const params = new URLSearchParams({ limit: "200", section });
      const res = await apiFetch(
        `api/admin/communities/${encodeURIComponent(community)}/rooms?${params}`,
        { method: "GET" },
      );
      const data = await res.json();
      if (cancelled) return;
      if (!res.ok) {
        setError(data.msg ?? "Failed to load rooms");
        setRooms([]);
      } else {
        setRooms(data.items ?? []);
      }
      setLoadingRooms(false);
    }

    void loadRooms();
    return () => {
      cancelled = true;
    };
  }, [community, section]);

  useEffect(() => {
    if (section && sections.length > 0 && !sections.includes(section)) {
      setSection("");
      setRoomId("");
    }
  }, [community, sections, section]);

  const selectedRoom = rooms.find((r) => r._id === roomId);

  async function performMove() {
    if (!selectedRoom) {
      setError("Select a destination room");
      throw new Error("Select a destination room");
    }
    const res = await apiFetch(`api/admin/residents/${residentId}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        community,
        section: selectedRoom.section,
        room: selectedRoom.room,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.msg ?? "Move failed");
      throw new Error(json.msg ?? "Move failed");
    }
    onMoved();
  }

  const moveSummary = selectedRoom
    ? `${community} · ${selectedRoom.section} · Room ${selectedRoom.room} (vacancy ${selectedRoom.vacancy ?? "?"})`
    : "Select a room with available capacity";

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Current: {currentCommunity} · {currentSection} · Room {currentRoom}
      </p>

      <div className="space-y-1">
        <Label>Community</Label>
        <Select value={community} onValueChange={setCommunity}>
          <SelectTrigger>
            <SelectValue placeholder="Community" />
          </SelectTrigger>
          <SelectContent>
            {communities.map((c) => (
              <SelectItem key={c.name} value={c.name}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>Section</Label>
        <Select value={section} onValueChange={setSection}>
          <SelectTrigger>
            <SelectValue placeholder="Section" />
          </SelectTrigger>
          <SelectContent>
            {sections.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>Room</Label>
        <Select
          value={roomId}
          onValueChange={setRoomId}
          disabled={loadingRooms || !section}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={loadingRooms ? "Loading rooms..." : "Select room"}
            />
          </SelectTrigger>
          <SelectContent>
            {rooms
              .filter((r) => (r.vacancy ?? 0) > 0)
              .map((r) => (
                <SelectItem key={r._id} value={r._id}>
                  Room {r.room} — cap {r.capacity}, vacancy {r.vacancy ?? 0}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <ConfirmActionDialog
        title="Move resident?"
        description={`Move this resident to ${moveSummary}? This updates their assignment immediately.`}
        confirmLabel="Move"
        onConfirm={performMove}
        trigger={
          <Button className="w-full" disabled={!roomId}>
            Move resident
          </Button>
        }
      />
    </div>
  );
}
