"use client";

import { useEffect, useState } from "react";
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
import ConfirmActionDialog from "@/components/housing/ConfirmActionDialog";
import { useCommunityOptions } from "@/hooks/use-community-options";
import { apiFetch } from "@/lib/api-client";
import { useNotification } from "@/context/notification-context";
import { useRouter } from "next/navigation";

type RoomOption = {
  _id: string;
  section: string;
  room: string;
  capacity: number;
  vacancy?: number;
};

type Props = {
  defaultCommunity?: string;
  residentsHref?: string;
};

export default function ResidentAddForm({
  defaultCommunity = "",
  residentsHref = "/admin/residents",
}: Props) {
  const { communities, loading: loadingCommunities } = useCommunityOptions();
  const { show } = useNotification();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    studentId: "",
    community: defaultCommunity,
    section: "",
    notes: "",
  });

  const selectedCommunity = communities.find((c) => c.name === form.community);
  const sections = selectedCommunity?.sections ?? [];
  const selectedRoom = rooms.find((r) => r._id === roomId);

  useEffect(() => {
    if (defaultCommunity && !form.community) {
      setForm((f) => ({ ...f, community: defaultCommunity }));
    }
  }, [defaultCommunity, form.community]);

  useEffect(() => {
    if (!form.community || !form.section) {
      setRooms([]);
      setRoomId("");
      return;
    }

    let cancelled = false;
    setLoadingRooms(true);

    async function loadRooms() {
      const params = new URLSearchParams({ limit: "200", section: form.section });
      const res = await apiFetch(
        `api/admin/communities/${encodeURIComponent(form.community)}/rooms?${params}`,
        { method: "GET" },
      );
      const data = await res.json();
      if (cancelled) return;
      if (res.ok) {
        setRooms(data.items ?? []);
      } else {
        setRooms([]);
      }
      setLoadingRooms(false);
    }

    void loadRooms();
    return () => {
      cancelled = true;
    };
  }, [form.community, form.section]);

  useEffect(() => {
    if (form.section && sections.length > 0 && !sections.includes(form.section)) {
      setForm((f) => ({ ...f, section: "" }));
      setRoomId("");
    }
  }, [form.community, sections, form.section]);

  async function handleSubmit() {
    if (!selectedRoom) {
      show({
        msg: "Select a room with available capacity",
        type: "error",
        closable: true,
        duration: null,
      });
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch("api/admin/residents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          room: selectedRoom.room,
          fullName: `${form.firstName} ${form.lastName}`.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.msg ?? "Create failed");

      show({ msg: "Resident added", type: "success", duration: 3000 });
      router.push(`${residentsHref}/${json.resident._id}`);
    } catch (err) {
      show({
        msg: err instanceof Error ? err.message : "Create failed",
        type: "error",
        closable: true,
        duration: null,
      });
    } finally {
      setLoading(false);
    }
  }

  const placementSummary = selectedRoom
    ? `${form.community} · ${selectedRoom.section} · Room ${selectedRoom.room}`
    : "Select community, section, and room";

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      noValidate
      className="space-y-4"
    >
      <div className="space-y-1">
        <Label>Community</Label>
        <Select
          value={form.community}
          onValueChange={(v) =>
            setForm((f) => ({ ...f, community: v, section: "" }))
          }
          disabled={loadingCommunities}
        >
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
      </div>

      <div className="space-y-1">
        <Label>Section</Label>
        <Select
          value={form.section}
          onValueChange={(v) => setForm((f) => ({ ...f, section: v }))}
          disabled={!form.community}
        >
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
      </div>

      <div className="space-y-1">
        <Label>Room</Label>
        <Select
          value={roomId}
          onValueChange={setRoomId}
          disabled={loadingRooms || !form.section}
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
        <Label>Notes</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
      </div>

      <ConfirmActionDialog
        title="Add resident?"
        description={`Create this resident at ${placementSummary}? They will appear in the system immediately.`}
        confirmLabel="Add resident"
        onConfirm={handleSubmit}
        trigger={
          <Button type="button" disabled={loading || !roomId} className="w-full text-white">
            {loading ? "Adding..." : "Add resident"}
          </Button>
        }
      />
    </form>
  );
}
