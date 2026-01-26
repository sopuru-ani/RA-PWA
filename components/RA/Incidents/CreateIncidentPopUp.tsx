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

import { Plus, ArrowLeft, ChevronDownIcon, Minus, Router } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CommunityLean } from "@/db/community.models";
import { UserType } from "@/db/user.model";
import { RoomLean } from "@/db/room.model";

interface Props {
  communityInfo: CommunityLean[];
  user: UserType;
  rooms: RoomLean[];
  onSuccess: () => void;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL_LAN;
function CreateIncidentPopUp({ communityInfo, user, rooms, onSuccess }: Props) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [incidentType, setIncidentType] = useState("Maintenance");
  const [section, setSection] = useState(user.assignment[0]);
  const [hour, setHour] = useState("12");
  const [minute, setMinute] = useState("00");
  const [meridiem, setMeridiem] = useState("AM");

  // People involved state is now an array
  const [peopleInvolved, setPeopleInvolved] = useState([""]);

  const filteredRooms = rooms
    .filter((r) => r.section === section)
    .sort((a, b) => a.room.localeCompare(b.room));
  const [room, setRoom] = useState(filteredRooms[0].room);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    // Remove all old involved
    formData.delete("involved");
    // Append all from state
    peopleInvolved.forEach((person) => {
      if (person.trim()) formData.append("involved", person.trim());
    });

    // controlled values
    formData.append("type", incidentType);
    formData.append("section", section);
    formData.append("room", room);
    formData.append("community", user.community[0]);
    // if (date) formData.append("incidentDate", date.toISOString());
    if (date) {
      // clone date so we don't mutate state directly
      const newDate = new Date(date);

      // convert hour to 24-hour format
      let h = parseInt(hour);
      if (meridiem === "PM" && h !== 12) h += 12;
      if (meridiem === "AM" && h === 12) h = 0;

      newDate.setHours(h);
      newDate.setMinutes(parseInt(minute));
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);

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
      console.error("Failed to submit incident", err);
    }
  };

  const handleAddPerson = () => setPeopleInvolved([...peopleInvolved, ""]);
  const handleRemovePerson = (index: number) => {
    setPeopleInvolved(peopleInvolved.filter((_, i) => i !== index));
  };
  const handleChangePerson = (index: number, value: string) => {
    const updated = [...peopleInvolved];
    updated[index] = value;
    setPeopleInvolved(updated);
  };

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="text-white">
            <Plus /> Create Incident
          </Button>
        </DialogTrigger>
        <DialogContent
          className="flex flex-col h-[calc(100dvh-2rem)] min-w-[calc(100dvw-2rem)] content-start gap-0 px-3 md:px-6"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div className="w-full flex flex-row items-center gap-3">
            <DialogClose asChild className="w-fit h-fit p-0 rounded-full m-0">
              <ArrowLeft className="w-8 h-8 rounded-full bg-gray-200 dark:bg-popover p-1" />
            </DialogClose>
            <DialogTitle>Create Incident</DialogTitle>
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
                  <Select value={incidentType} onValueChange={setIncidentType}>
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
                        <label className="text-sm font-medium">Room</label>
                        <Select value={room} onValueChange={setRoom}>
                          <SelectTrigger>
                            <SelectValue placeholder="" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredRooms.map((room) => (
                              <SelectItem key={room.room} value={room.room}>
                                {room.room}
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
                      <Input id="location" name="location" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Title</label>
                      <Input id="title" name="title" />
                    </div>

                    {(incidentType === "Policy Violation" ||
                      incidentType === "Health and Safety" ||
                      incidentType === "Other") && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          People Involved
                        </label>
                        <div className="flex flex-col gap-2">
                          {peopleInvolved.map((person, i) => (
                            <div key={i} className="flex gap-2 items-center">
                              <Input
                                id={`involved-${i}`}
                                name="involved"
                                className="flex-1"
                                placeholder={`Person ${i + 1}`}
                                value={person}
                                onChange={(e) =>
                                  handleChangePerson(i, e.target.value)
                                }
                              />
                              {i === 0 ? (
                                <button
                                  type="button"
                                  onClick={handleAddPerson}
                                  className="border border-input p-2 rounded-md shadow-xs hover:bg-gray-200 transition"
                                  aria-label="Add person"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleRemovePerson(i)}
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
                      <Textarea id="description" name="description" rows={4} />
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
                            disabled={(date) => date > new Date()}
                            onSelect={(date) => {
                              setDate(date);
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
                        <Select value={hour} onValueChange={setHour}>
                          <SelectTrigger className="w-18">
                            <SelectValue placeholder="" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => (
                              <SelectItem key={i + 1} value={`${i + 1}`}>
                                {i + 1}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <span>:</span>

                        <Select value={minute} onValueChange={setMinute}>
                          <SelectTrigger className="w-18">
                            <SelectValue placeholder="" />
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

                        <Select value={meridiem} onValueChange={setMeridiem}>
                          <SelectTrigger className="w-18">
                            <SelectValue placeholder="" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AM">AM</SelectItem>
                            <SelectItem value="PM">PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="md:w-fit text-white"
                      disabled={loading}
                    >
                      Submit Incident
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

export default CreateIncidentPopUp;
