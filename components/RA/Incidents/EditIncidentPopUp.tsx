"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, ArrowLeft, ChevronDownIcon, Pencil, Minus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CommunityLean } from "@/db/community.models";
import { UserType } from "@/db/user.model";
import { RoomLean } from "@/db/room.model";
import { IncidentLean } from "@/db/incident.model";

type IncidentType =
  | "Policy Violation"
  | "Maintenance"
  | "Health and Safety"
  | "Other";

interface Props {
  communityInfo: CommunityLean[];
  user: UserType;
  rooms: RoomLean[];
  onSuccess: () => void;
  incident: IncidentLean;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL_LAN;
function EditIncidentPopUp({
  communityInfo,
  user,
  rooms,
  onSuccess,
  incident,
}: Props) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // prefill state from incident
  const [date, setDate] = useState<Date | undefined>(
    new Date(incident.incidentDate),
  );
  const [incidentType, setIncidentType] = useState<IncidentType>(incident.type);
  const [section, setSection] = useState(
    incident.section ?? user.assignment[0],
  );
  // Add these state hooks near the top with your other state
  const [hour, setHour] = useState(
    incident.incidentDate
      ? new Date(incident.incidentDate).getHours() % 12 || 12
      : 12,
  );
  const [minute, setMinute] = useState(
    incident.incidentDate ? new Date(incident.incidentDate).getMinutes() : 0,
  );
  const [ampm, setAmpm] = useState(
    incident.incidentDate
      ? new Date(incident.incidentDate).getHours() >= 12
        ? "PM"
        : "AM"
      : "AM",
  );
  const [resolved, setResolved] = useState<boolean>(incident.resolved ?? false);

  const filteredRooms = rooms
    .filter((r) => r.section === section)
    .sort((a, b) => a.room.localeCompare(b.room));
  const [room, setRoom] = useState(incident.room ?? filteredRooms[0].room);

  // Dynamic involved fields state
  const [involvedList, setInvolvedList] = useState<string[]>(
    incident.involved && incident.involved.length > 0
      ? incident.involved
      : [""],
  );

  const handleInvolvedChange = (index: number, value: string) => {
    const updated = [...involvedList];
    updated[index] = value;
    setInvolvedList(updated);
  };

  const addInvolved = () => setInvolvedList([...involvedList, ""]);
  const removeInvolved = (index: number) => {
    const updated = involvedList.filter((_, i) => i !== index);
    setInvolvedList(updated.length > 0 ? updated : [""]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    // append controlled involved inputs
    formData.delete("involved");
    involvedList
      .map((v) => v.trim())
      .filter(Boolean)
      .forEach((v) => formData.append("involved", v));

    formData.append("type", incidentType);
    formData.append("section", section);
    formData.append("room", room);
    formData.append("community", user.community[0]);
    formData.append("resolved", String(resolved));
    formData.append("resolvedAt", new Date().toISOString());
    formData.append("id", incident._id);

    // if (date) formData.append("incidentDate", date.toISOString());
    if (date) {
      const newDate = new Date(date);
      let adjustedHour = hour % 12;
      if (ampm === "PM") adjustedHour += 12;
      newDate.setHours(adjustedHour, minute, 0, 0);
      formData.append("incidentDate", newDate.toISOString());
    }

    try {
      const res = await fetch(`${BASE_URL}api/incidents`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) {
        setLoading(false);
        setSuccess("");
        setError(data.msg);
        const viewport = dialogRef.current?.querySelector(
          "[data-radix-scroll-area-viewport]",
        ) as HTMLDivElement | null;

        if (viewport) {
          viewport.scrollTo({ top: 0, behavior: "smooth" });
        }
        return;
      }

      setLoading(false);
      setError("");
      setSuccess(data.msg);
      const viewport = dialogRef.current?.querySelector(
        "[data-radix-scroll-area-viewport]",
      ) as HTMLDivElement | null;

      if (viewport) {
        viewport.scrollTo({ top: 0, behavior: "smooth" });
      }
      setTimeout(() => {
        onSuccess();
      }, 1500);
      setTimeout(() => setDialogOpen(false), 3000);
    } catch (err) {
      console.error("Failed to update incident", err);
    }
  };

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <button
            className="absolute bottom-2 right-2 rounded-md p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-pointer"
            aria-label="Edit incident"
          >
            <Pencil className="h-5 w-5" />
          </button>
        </DialogTrigger>
        <DialogContent
          className="flex flex-col h-[calc(100dvh-2rem)] min-w-[calc(100dvw-2rem)] content-start gap-0 px-3 md:px-6"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div className="w-full flex flex-row items-center gap-3">
            <DialogClose asChild className="w-fit h-fit p-0 rounded-full m-0">
              <ArrowLeft className="w-8 h-8 rounded-full bg-gray-200 dark:bg-popover p-1" />
            </DialogClose>
            <DialogTitle>Edit Incident</DialogTitle>
          </div>
          <Separator className="my-3" />
          <ScrollArea
            className="flex-1 overflow-y-auto rounded-xs pr-4"
            ref={dialogRef}
          >
            <div className="flex">
              <div className="min-h-full md:w-[50dvw]">
                {error && (
                  <div className="border-l-4 border-red-500 bg-red-100 text-red-800 px-4 py-2 my-2 rounded-sm">
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}
                {success && (
                  <div className="border-l-4 border-green-500 bg-green-100 text-green-800 px-4 py-2 my-2 rounded-sm">
                    <p className="text-sm font-medium">{success}</p>
                  </div>
                )}

                <div className="flex flex-row items-center gap-4 mb-3">
                  <p>Incident Type: </p>
                  <Select
                    value={incidentType}
                    onValueChange={(value) =>
                      setIncidentType(value as IncidentType)
                    }
                  >
                    <SelectTrigger className="w-fit">
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Policy Violation">
                        Policy Violation
                      </SelectItem>
                      <SelectItem value="Health and Safety">
                        Health and Safety
                      </SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-1 gap-2 md:gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Section</label>
                        <Select value={section} onValueChange={setSection}>
                          <SelectTrigger className="w-fit">
                            <SelectValue placeholder="" />
                          </SelectTrigger>
                          <SelectContent>
                            {communityInfo[0].section.map((sec) => (
                              <SelectItem key={sec} value={sec}>
                                {sec}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Resolved</label>

                        <Select
                          value={resolved ? "true" : "false"}
                          onValueChange={(val) => setResolved(val === "true")}
                        >
                          <SelectTrigger className="w-fit">
                            <SelectValue />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value="false">Unresolved</SelectItem>
                            <SelectItem value="true">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Room</label>
                        <Select value={room} onValueChange={setRoom}>
                          <SelectTrigger>
                            <SelectValue placeholder="" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredRooms.map((r) => (
                              <SelectItem key={r.room} value={r.room}>
                                {r.room}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Location{" "}
                        <span className="text-muted-foreground">
                          (if not a room)
                        </span>
                      </label>
                      <Input
                        id="location"
                        name="location"
                        defaultValue={incident.location ?? ""}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Title</label>
                      <Input
                        id="title"
                        name="title"
                        defaultValue={incident.title}
                      />
                    </div>

                    {(incidentType === "Policy Violation" ||
                      incidentType === "Health and Safety" ||
                      incidentType === "Other") && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          People Involved
                        </label>
                        <div className="flex flex-col gap-2">
                          {involvedList.map((value, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                id={`involved-${index}`}
                                name="involved"
                                className="flex-1"
                                value={value}
                                placeholder={`Person ${index + 1}`}
                                onChange={(e) =>
                                  handleInvolvedChange(index, e.target.value)
                                }
                              />
                              {index === 0 && (
                                <button
                                  onClick={addInvolved}
                                  type="button"
                                  className="border border-input p-2 rounded-md shadow-xs hover:bg-gray-200 transition"
                                  aria-label="Add person"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              )}
                              {index > 0 && (
                                <button
                                  onClick={() => removeInvolved(index)}
                                  type="button"
                                  className="border border-input p-2 rounded-md shadow-xs hover:bg-gray-200 transition"
                                  aria-label="Remove person"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        id="description"
                        name="description"
                        rows={4}
                        defaultValue={incident.description}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium block">Date</label>
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            id="date"
                            className="w-48 justify-between font-normal"
                          >
                            {date ? date.toLocaleDateString() : "Select date"}
                            <ChevronDownIcon />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto overflow-hidden p-0"
                          align="start"
                        >
                          <Calendar
                            mode="single"
                            selected={date}
                            disabled={(d) => d > new Date()}
                            onSelect={(d) => {
                              setDate(d);
                              setOpen(false);
                            }}
                            captionLayout="dropdown"
                            className="rounded-md border"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium block">Time</label>
                      <div className="flex gap-2 items-center">
                        {/* Hour */}
                        <Select
                          value={hour.toString()}
                          onValueChange={(v) => setHour(Number(v))}
                        >
                          <SelectTrigger className="w-18">
                            <SelectValue placeholder="Hour" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => (
                              <SelectItem
                                key={i + 1}
                                value={(i + 1).toString()}
                              >
                                {i + 1}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <span>:</span>

                        {/* Minute */}
                        <Select
                          value={minute.toString().padStart(2, "0")}
                          onValueChange={(v) => setMinute(Number(v))}
                        >
                          <SelectTrigger className="w-18">
                            <SelectValue placeholder="Minute" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 60 }, (_, i) => (
                              <SelectItem
                                key={i}
                                value={i.toString().padStart(2, "0")}
                              >
                                {i.toString().padStart(2, "0")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* AM/PM */}
                        <Select value={ampm} onValueChange={setAmpm}>
                          <SelectTrigger className="w-18">
                            <SelectValue placeholder="AM/PM" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AM">AM</SelectItem>
                            <SelectItem value="PM">PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button type="submit" className="md:w-fit text-white">
                      Save Changes
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </ScrollArea>
          <Separator className="mt-3" />
        </DialogContent>
      </Dialog>
    </>
  );
}

export default EditIncidentPopUp;
