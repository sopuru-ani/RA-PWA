"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotification } from "@/context/notification-context";
import type { CommunityDetail, SectionSummary } from "@/types/admin";
import type { RoomWithVacancy } from "@/db/room.model";

type Tab = "overview" | "sections" | "rooms";

export default function AdminCommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const communityName = decodeURIComponent(params.community as string);
  const { show } = useNotification();

  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<CommunityDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const [newSection, setNewSection] = useState("");
  const [renameSection, setRenameSection] = useState<{
    old: string;
    value: string;
  } | null>(null);

  const [roomSectionFilter, setRoomSectionFilter] = useState<string>("all");
  const [rooms, setRooms] = useState<RoomWithVacancy[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomForm, setRoomForm] = useState({
    section: "",
    room: "",
    capacity: "1",
  });
  const [bulkSections, setBulkSections] = useState<string[]>([]);
  const [bulkRooms, setBulkRooms] = useState("");
  const [bulkCapacity, setBulkCapacity] = useState("1");

  const load = useCallback(async () => {
    const res = await apiFetch(
      `api/admin/communities/${encodeURIComponent(communityName)}`,
      { method: "GET" },
    );
    const json = await res.json();
    if (res.ok) {
      setData(json.community);
      setRoomForm((f) =>
        f.section ? f : { ...f, section: json.community.sections?.[0] ?? "" },
      );
    }
    setLoading(false);
  }, [communityName]);

  const loadRooms = useCallback(async () => {
    if (!data) return;
    setRoomsLoading(true);
    const params = new URLSearchParams({ limit: "100" });
    if (roomSectionFilter !== "all") {
      params.set("section", roomSectionFilter);
    }
    const res = await apiFetch(
      `api/admin/communities/${encodeURIComponent(data.name)}/rooms?${params}`,
      { method: "GET" },
    );
    const json = await res.json();
    if (res.ok) setRooms(json.items ?? []);
    setRoomsLoading(false);
  }, [data, roomSectionFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (tab === "rooms" && data) loadRooms();
  }, [tab, data, loadRooms]);

  async function renameCommunity() {
    const res = await apiFetch(
      `api/admin/communities/${encodeURIComponent(communityName)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameValue }),
      },
    );
    const json = await res.json();
    if (!res.ok) {
      show({ msg: json.msg ?? "Rename failed", type: "error", duration: null, closable: true });
      return;
    }
    setRenameOpen(false);
    router.replace(
      `/admin/communities/${encodeURIComponent(renameValue.trim())}`,
    );
  }

  async function deleteCommunity() {
    const res = await apiFetch(
      `api/admin/communities/${encodeURIComponent(communityName)}`,
      { method: "DELETE" },
    );
    const json = await res.json();
    if (!res.ok) {
      show({ msg: json.msg ?? "Delete failed", type: "error", duration: null, closable: true });
      return;
    }
    router.push("/admin/communities");
  }

  async function addSection() {
    const res = await apiFetch(
      `api/admin/communities/${encodeURIComponent(communityName)}/sections`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSection }),
      },
    );
    const json = await res.json();
    if (!res.ok) {
      show({ msg: json.msg ?? "Failed", type: "error", duration: null, closable: true });
      return;
    }
    setNewSection("");
    show({ msg: "Section added", type: "success", duration: 1500 });
    load();
  }

  async function saveSectionRename() {
    if (!renameSection) return;
    const res = await apiFetch(
      `api/admin/communities/${encodeURIComponent(communityName)}/sections/${encodeURIComponent(renameSection.old)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameSection.value }),
      },
    );
    const json = await res.json();
    if (!res.ok) {
      show({ msg: json.msg ?? "Rename failed", type: "error", duration: null, closable: true });
      return;
    }
    setRenameSection(null);
    show({ msg: "Section renamed", type: "success", duration: 1500 });
    load();
  }

  async function deleteSection(name: string) {
    const res = await apiFetch(
      `api/admin/communities/${encodeURIComponent(communityName)}/sections/${encodeURIComponent(name)}`,
      { method: "DELETE" },
    );
    const json = await res.json();
    if (!res.ok) {
      show({ msg: json.msg ?? "Delete failed", type: "error", duration: null, closable: true });
      return;
    }
    show({ msg: "Section removed", type: "success", duration: 1500 });
    load();
  }

  async function createRoom() {
    const res = await apiFetch(
      `api/admin/communities/${encodeURIComponent(communityName)}/rooms`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: roomForm.section,
          room: roomForm.room,
          capacity: Number(roomForm.capacity),
        }),
      },
    );
    const json = await res.json();
    if (!res.ok) {
      show({ msg: json.msg ?? "Failed", type: "error", duration: null, closable: true });
      return;
    }
    setRoomForm((f) => ({ ...f, room: "" }));
    show({ msg: "Room created", type: "success", duration: 1500 });
    loadRooms();
    load();
  }

  async function bulkCreateRooms() {
    const roomNumbers = bulkRooms
      .split(/[\n,]/)
      .map((r) => r.trim())
      .filter(Boolean);
    const res = await apiFetch(
      `api/admin/communities/${encodeURIComponent(communityName)}/rooms/bulk`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sections: bulkSections.length ? bulkSections : data?.sections,
          rooms: roomNumbers,
          capacity: Number(bulkCapacity) || 1,
        }),
      },
    );
    const json = await res.json();
    if (!res.ok) {
      show({ msg: json.msg ?? "Bulk failed", type: "error", duration: null, closable: true });
      return;
    }
    show({
      msg: `${json.created ?? 0} rooms created${json.failed?.length ? `, ${json.failed.length} failed` : ""}`,
      type: json.failed?.length ? "neutral" : "success",
      duration: 4000,
    });
    loadRooms();
    load();
  }

  async function deleteRoom(id: string) {
    const res = await apiFetch(
      `api/admin/communities/${encodeURIComponent(communityName)}/rooms/${id}`,
      { method: "DELETE" },
    );
    const json = await res.json();
    if (!res.ok) {
      show({ msg: json.msg ?? "Delete failed", type: "error", duration: null, closable: true });
      return;
    }
    loadRooms();
    load();
  }

  if (loading) return <ListSkeleton rows={6} />;
  if (!data) {
    return <p className="text-sm text-muted-foreground mx-3">Community not found.</p>;
  }

  const summaries: SectionSummary[] = data.sectionSummaries ?? [];

  return (
    <div className="space-y-4 pb-4 mx-3">
      <Link
        href="/admin/communities"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All communities
      </Link>

      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">{data.name}</h1>
          <p className="text-sm text-muted-foreground">
            {data.residentCount} residents · {data.sections.length} sections ·{" "}
            {data.roomCount ?? 0} rooms
          </p>
        </div>
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="outline"
            onClick={() => {
              setRenameValue(data.name);
              setRenameOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="outline">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete community?</AlertDialogTitle>
                <AlertDialogDescription>
                  Only allowed when no residents remain. Rooms and staff links
                  for this community will be removed automatically.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteCommunity}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["overview", "sections", "rooms"] as Tab[]).map((t) => (
          <Button
            key={t}
            size="sm"
            variant={tab === t ? "default" : "outline"}
            onClick={() => setTab(t)}
            className={tab === t ? "text-white" : ""}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </Button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <Button asChild variant="outline" className="w-full">
            <Link
              href={`/admin/residents?community=${encodeURIComponent(data.name)}`}
            >
              View residents
            </Link>
          </Button>
          <div className="space-y-2">
            <p className="text-sm font-medium">Section staff</p>
            {data.sectionStaff.length === 0 ? (
              <p className="text-sm text-muted-foreground">No assignments yet.</p>
            ) : (
              data.sectionStaff.map((s) => (
                <Card key={s.section}>
                  <CardContent className="py-3 text-sm">
                    <p className="font-medium">Section {s.section}</p>
                    <p className="text-muted-foreground">RA: {s.raEmail}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      {tab === "sections" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="New section name"
              value={newSection}
              onChange={(e) => setNewSection(e.target.value)}
            />
            <Button onClick={addSection} disabled={!newSection.trim()}>
              Add
            </Button>
          </div>
          <div className="space-y-2">
            {summaries.map((s) => (
              <Card key={s.name}>
                <CardContent className="py-3 flex justify-between items-start gap-2">
                  <div className="text-sm">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-muted-foreground">
                      {s.roomCount} rooms · {s.residentCount} residents
                    </p>
                    {s.roomCount > 0 && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        Delete rooms before removing section
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setRenameSection({ old: s.name, value: s.name })
                      }
                    >
                      Rename
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => deleteSection(s.name)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === "rooms" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="py-4 space-y-3">
              <p className="text-sm font-medium">Add single room</p>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={roomForm.section}
                  onValueChange={(v) => setRoomForm((f) => ({ ...f, section: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Section" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.sections.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Room #"
                  value={roomForm.room}
                  onChange={(e) =>
                    setRoomForm((f) => ({ ...f, room: e.target.value }))
                  }
                />
              </div>
              <Input
                type="number"
                min={1}
                placeholder="Capacity"
                value={roomForm.capacity}
                onChange={(e) =>
                  setRoomForm((f) => ({ ...f, capacity: e.target.value }))
                }
              />
              <Button
                className="w-full"
                onClick={createRoom}
                disabled={!roomForm.section || !roomForm.room.trim()}
              >
                Add room
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4 space-y-3">
              <p className="text-sm font-medium">Bulk add rooms</p>
              <p className="text-xs text-muted-foreground">
                Creates each room number in every selected section
              </p>
              <div className="flex flex-wrap gap-2">
                {data.sections.map((s) => {
                  const on = bulkSections.includes(s);
                  return (
                    <Button
                      key={s}
                      size="sm"
                      variant={on ? "default" : "outline"}
                      className={on ? "text-white" : ""}
                      onClick={() =>
                        setBulkSections((prev) =>
                          on ? prev.filter((x) => x !== s) : [...prev, s],
                        )
                      }
                    >
                      {s}
                    </Button>
                  );
                })}
              </div>
              <Input
                placeholder="Room numbers (comma or newline)"
                value={bulkRooms}
                onChange={(e) => setBulkRooms(e.target.value)}
              />
              <Input
                type="number"
                min={1}
                value={bulkCapacity}
                onChange={(e) => setBulkCapacity(e.target.value)}
                placeholder="Capacity"
              />
              <Button variant="secondary" className="w-full" onClick={bulkCreateRooms}>
                Bulk create
              </Button>
            </CardContent>
          </Card>

          <Select value={roomSectionFilter} onValueChange={setRoomSectionFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sections</SelectItem>
              {data.sections.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {roomsLoading ? (
            <ListSkeleton rows={4} />
          ) : (
            <ScrollArea className="max-h-80">
              <div className="space-y-1 pb-4">
                {rooms.map((r) => (
                  <Card key={String(r._id)}>
                    <CardContent className="py-2 flex justify-between items-center text-sm">
                      <div>
                        <p className="font-medium">
                          {r.section} · Room {r.room}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Cap {r.capacity} · Vacancy {r.vacancy ?? 0}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => deleteRoom(String(r._id))}
                      >
                        Delete
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename community</DialogTitle>
          </DialogHeader>
          <Label>New name</Label>
          <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={renameCommunity}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={renameSection !== null}
        onOpenChange={(o) => !o && setRenameSection(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename section</DialogTitle>
          </DialogHeader>
          <Input
            value={renameSection?.value ?? ""}
            onChange={(e) =>
              setRenameSection((s) =>
                s ? { ...s, value: e.target.value } : s,
              )
            }
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameSection(null)}>
              Cancel
            </Button>
            <Button onClick={saveSectionRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
