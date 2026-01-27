"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ResidentLean } from "@/db/resident.model";
import type { RoomLean } from "@/db/room.model";
import type { RoomcheckLean } from "@/db/roomcheck.model";
import type { UserType } from "@/db/user.model";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import {
  AccordionTrigger,
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";

import { Camera } from "lucide-react";

import { useResidents } from "@/context/RAResidentProvider";
import Spinner from "@/components/RA/Spinner";
import { useVerifyAuth } from "@/hooks/useVerifyAuth";
type ResidentInspection = {
  studentId: string;
  name: string;
  email: string;
  isPass?: boolean;
  notes?: string;
};

type RoomsLeanandUpdatedAt = {
  community: string;
  section: string;
  room: string;
  capacity: number;
  vacancy: number;
  createdAt: Date;
  updated: Date | null;
};

type RoomInspectionDraft = {
  community: string;
  section: string;
  room: string;
  updatedAt: Date | null;
  residents: ResidentInspection[];
};

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL_LAN;
function page() {
  const router = useRouter();
  const checkingAuth = useVerifyAuth();
  const [theSessionId, setTheSessionId] = useState<string | null>(null);
  const [sessionDate, setSessionDate] = useState<string | null>(null);
  // const { sessionId }: { sessionId: string | null } = useResidents();

  useEffect(() => {
    const existing = localStorage.getItem("inspectionSession");
    const existingDate = localStorage.getItem("inspectionSessionDate");

    if (existing && existingDate) {
      setTheSessionId(existing);
      setSessionDate(existingDate);
    } else {
      const newId = crypto.randomUUID();
      const newDate = new Date();
      localStorage.setItem("inspectionSession", newId);
      localStorage.setItem("inspectionSessionDate", newDate.toISOString());
      setTheSessionId(newId);
      setSessionDate(newDate.toISOString());
    }
    // if (sessionId) {
    //   localStorage.setItem("inspectionSession", sessionId);
    //   setTheSessionId(sessionId);
    // }
  }, []);

  const defaultUser: UserType = {
    firstName: "",
    lastName: "",
    assignment: [""],
    community: [""],
    role: "",
  };

  const [progress, setProgress] = useState<number>(0);
  const [residents, setResidents] = useState<ResidentLean[]>([]);
  const [rooms, setRooms] = useState<RoomsLeanandUpdatedAt[]>([]);
  const [user, setUser] = useState<UserType>(defaultUser);
  const [vacancy, setVacancy] = useState<RoomLean[]>([]);
  const [loading, setLoading] = useState(true);

  if (checkingAuth) {
    return (
      <div className="h-dvh">
        <Spinner />
      </div>
    );
  }

  // 🔑 ARRAY OF ROOM INSPECTIONS
  const [inspectionData, setInspectionData] = useState<RoomInspectionDraft[]>(
    [],
  );

  // 🔁 Helper to add/update a resident inside a room
  const upsertResidentInspection = (
    roomInfo: { community: string; section: string; room: string },
    resident: { studentId: string; name: string; email: string },
    data: Partial<ResidentInspection>,
  ) => {
    setInspectionData((prev) => {
      const roomIdx = prev.findIndex(
        (r) => r.room === roomInfo.room && r.section === roomInfo.section,
      );

      if (roomIdx === -1) {
        // Room not yet in state
        return [
          ...prev,
          {
            ...roomInfo,
            updatedAt: null,
            residents: [
              {
                ...resident,
                ...data,
              },
            ],
          },
        ];
      }

      const roomEntry = prev[roomIdx];
      const residentIdx = roomEntry.residents.findIndex(
        (r) => r.studentId === resident.studentId,
      );

      const updatedResidents =
        residentIdx === -1
          ? [...roomEntry.residents, { ...resident, ...data }]
          : roomEntry.residents.map((r, i) =>
              i === residentIdx ? { ...r, ...data } : r,
            );

      return prev.map((entry, i) =>
        i === roomIdx ? { ...entry, residents: updatedResidents } : entry,
      );
    });
  };

  useEffect(() => {
    if (!theSessionId) return;
    let isMounted = true;

    async function fetchResidents() {
      try {
        const response = await fetch(`${BASE_URL}api/ra/inspections`, {
          method: "POST",
          credentials: "include",
          body: JSON.stringify({ sessionId: theSessionId }),
        });
        const result: {
          msg: string;
          residents: ResidentLean[];
          rooms: RoomLean[];
          roomsChecked: RoomcheckLean[];
          user: UserType;
        } = await response.json();
        if (response.status === 401) {
          router.replace("/login");
        }
        if (result.roomsChecked.length < 1) {
          localStorage.setItem(
            "inspectionSessionDate",
            new Date().toISOString(),
          );
          setSessionDate(localStorage.getItem("inspectionSessionDate"));
        } else {
          localStorage.setItem(
            "inspectionSession",
            result.roomsChecked[0].inspectionSession,
          );
          localStorage.setItem(
            "inspectionSessionDate",
            new Date(result.roomsChecked[0].inspectionDate).toISOString(),
          );
          setTheSessionId(localStorage.getItem("inspectionSession"));
          setSessionDate(localStorage.getItem("inspectionSessionDate"));
        }
        const roomsWithUI: RoomsLeanandUpdatedAt[] = result.rooms.map(
          (room) => {
            const checked = result.roomsChecked.find(
              (r) => r.room === room.room && r.section === room.section,
            );

            return {
              ...room,
              updated: checked ? checked.updatedAt : null,
            };
          },
        );
        const prefilledInspectionData: RoomInspectionDraft[] =
          result.roomsChecked.map((rc) => ({
            community: rc.community,
            section: rc.section,
            room: rc.room,
            updatedAt: rc.updatedAt,
            residents: rc.residents.map((res) => ({
              studentId: res.studentId,
              name: res.name,
              email: res.email,
              isPass: res.isPass,
              notes: res.notes,
            })),
          }));

        if (isMounted) {
          setResidents(result.residents);
          setRooms(roomsWithUI);
          setUser(result.user);
          setInspectionData(prefilledInspectionData);
          const residentsByRoom = new Map<string, ResidentLean[]>();

          result.residents.forEach((resident) => {
            const key = `${resident.section}-${resident.room}`;
            const list = residentsByRoom.get(key) ?? [];
            list.push(resident);
            residentsByRoom.set(key, list);
          });

          const completedCount = roomsWithUI.filter((room) => {
            const key = `${room.section}-${room.room}`;
            const roomResidents = residentsByRoom.get(key) ?? [];

            const isVacant = roomResidents.length === 0;
            const isChecked = room.updated !== null;

            return isVacant || isChecked;
          }).length;

          setProgress(completedCount);

          const vacancies = result.rooms.filter(
            (room) => Number(room.vacancy) > 0,
          );
          setVacancy(vacancies);
        }
      } catch (error) {
        console.error("Failed to fetch residents:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchResidents();

    return () => {
      isMounted = false;
    };
  }, [theSessionId]);

  function displayEach(index: string) {
    const newData = inspectionData.filter((room) => room.room === index);
    return newData[0];
  }
  function isRoomComplete(room: RoomsLeanandUpdatedAt) {
    const roomResidents = residents.filter(
      (resident) => resident.room === room.room,
    );

    // Vacant rooms are automatically complete
    if (roomResidents.length === 0) return true;

    const roomEntry = inspectionData.find(
      (r) => r.room === room.room && r.section === room.section,
    );

    return roomResidents.every((resident) => {
      const entry = roomEntry?.residents.find(
        (r) => r.studentId === resident.studentId,
      );

      return entry?.isPass === true || entry?.isPass === false;
    });
  }
  function isRoomVacant(room: RoomsLeanandUpdatedAt) {
    return (
      residents.filter((resident) => resident.room === room.room).length === 0
    );
  }

  function getRoomProgress() {
    if (rooms.length === 0) return 0;

    const completedRooms = rooms.filter(isRoomComplete).length;

    // return Math.round((completedRooms / rooms.length) * 100);
    return completedRooms;
  }

  async function oneRoomChecked(roomNumber: string) {
    const oneRoom = displayEach(roomNumber);
    try {
      const response = await fetch(`${BASE_URL}api/ra/inspections/room-check`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: oneRoom,
          sessionId: theSessionId,
          sessionDate: sessionDate,
        }),
      });
      const { msg } = await response.json();
      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (response.ok) {
        setRooms((prev) =>
          prev.map((room) =>
            room.room === roomNumber
              ? { ...room, updated: msg ?? new Date().toISOString() }
              : room,
          ),
        );
        setInspectionData((prev) =>
          prev.map((r) =>
            r.room === roomNumber
              ? { ...r, updatedAt: msg ?? new Date().toISOString() }
              : r,
          ),
        );
      }
    } catch (error: unknown) {}
  }
  async function allChecked() {
    try {
      const response = await fetch(
        `${BASE_URL}api/ra/inspections/all-checked`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId: theSessionId,
            sessionDate: sessionDate,
          }),
        },
      );
      const { msg } = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (response.ok) {
        localStorage.removeItem("inspectionSession");
        localStorage.removeItem("inspectionSessionDate");
        router.push("/ra/dashboard/inspections");
      }
    } catch (error: unknown) {}
  }
  const inputRef = useRef<HTMLInputElement>(null);

  const openCamera = () => {
    inputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // send to backend, upload to S3, etc.
  };

  if (loading)
    return (
      <div className="h-dvh">
        <Spinner />
      </div>
    );

  return (
    <div className="flex flex-col py-2 h-dvh">
      <div className="px-3 pb-2">
        <div className="flex flex-row justify-between">
          <h3>Room checks</h3>
          <p>
            {progress}\{rooms.length}
          </p>
        </div>
        <Progress value={(progress / rooms.length) * 100} className="h-1" />
      </div>

      <ScrollArea className="flex-1 overflow-y-auto rounded-xs">
        <div className="flex flex-col gap-2 px-3 pb-2">
          {rooms.map((room, i) => (
            <Card
              className="rounded-2xl shadow-sm py-2 px-3 md:border-0 md:border-b md:shadow-none md:rounded-none"
              key={i}
            >
              <Accordion type="single" collapsible>
                <AccordionItem value="room-1" className="border-none">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex flex-col text-left">
                      <span className="text-sm text-muted-foreground">
                        {room.section}
                      </span>
                      <span className="text-base font-semibold">
                        Room {room.room}
                      </span>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-2">
                      {residents.filter(
                        (resident) => resident.room === room.room,
                      ).length ? (
                        residents
                          .filter((resident) => resident.room === room.room)
                          .map((resident, idx) => {
                            const roomEntry = inspectionData.find(
                              (r) =>
                                r.room === room.room &&
                                r.section === room.section,
                            );
                            const entry = roomEntry?.residents.find(
                              (r) => r.studentId === resident.studentId,
                            );

                            return (
                              <Accordion
                                key={idx}
                                type="single"
                                collapsible
                                className="rounded-md border bg-muted/40 px-3"
                              >
                                <AccordionItem value={`resident-${idx}`}>
                                  <AccordionTrigger className="py-2 text-sm font-medium">
                                    {resident.fullName}
                                  </AccordionTrigger>

                                  <AccordionContent className="pb-3">
                                    <div className="space-y-3 flex flex-col">
                                      {/* Status */}
                                      <div className="space-y-1 flex flex-col">
                                        <span className="text-sm font-medium">
                                          Status
                                        </span>

                                        <RadioGroup
                                          className="flex gap-4"
                                          defaultValue={
                                            entry?.isPass === undefined
                                              ? undefined
                                              : entry.isPass
                                                ? "pass"
                                                : "fail"
                                          }
                                          onValueChange={(value) =>
                                            upsertResidentInspection(
                                              {
                                                community: user.community[0],
                                                section: room.section,
                                                room: room.room,
                                              },
                                              {
                                                studentId: resident.studentId,
                                                name: resident.fullName,
                                                email: resident.email,
                                              },
                                              {
                                                isPass: value === "pass",
                                              },
                                            )
                                          }
                                        >
                                          <div className="flex items-center gap-2">
                                            <RadioGroupItem
                                              value="pass"
                                              id={`pass-${idx}`}
                                            />
                                            <Label htmlFor={`pass-${idx}`}>
                                              Pass
                                            </Label>
                                          </div>

                                          <div className="flex items-center gap-2">
                                            <RadioGroupItem
                                              value="fail"
                                              id={`fail-${idx}`}
                                            />
                                            <Label
                                              htmlFor={`fail-${idx}`}
                                              className="text-destructive"
                                            >
                                              Fail
                                            </Label>
                                          </div>
                                        </RadioGroup>
                                      </div>

                                      {/* Notes */}
                                      <div className="space-y-1 flex flex-col">
                                        <label className="text-sm font-medium">
                                          Notes
                                        </label>
                                        <Textarea
                                          value={entry?.notes || ""}
                                          onChange={(e) =>
                                            upsertResidentInspection(
                                              {
                                                community: user.community[0],
                                                section: room.section,
                                                room: room.room,
                                              },
                                              {
                                                studentId: resident.studentId,
                                                name: resident.fullName,
                                                email: resident.email,
                                              },
                                              {
                                                notes: e.target.value,
                                              },
                                            )
                                          }
                                          placeholder={`Notes for ${resident.fullName}`}
                                        />
                                      </div>
                                      {/* <div className="space-y-1 hidden">
                                        <Button
                                          className="text-white"
                                          onClick={openCamera}
                                        >
                                          <Camera className="w-5! h-5!" />
                                        </Button>
                                        <input
                                          ref={inputRef}
                                          type="file"
                                          accept="image/*"
                                          capture="environment"
                                          onChange={onFileChange}
                                          hidden
                                        />
                                      </div> */}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            );
                          })
                      ) : (
                        <p>Vacant Room</p>
                      )}
                    </div>
                    <div className="flex flex-row gap-2 items-center mt-2">
                      <Button
                        className={
                          "text-white hover:opacity-90" +
                          (isRoomVacant(room) ? " hidden" : "")
                        }
                        disabled={!isRoomComplete(room)}
                        onClick={() => {
                          displayEach(room.room);
                          oneRoomChecked(room.room);
                          setProgress(getRoomProgress());
                        }}
                      >
                        checked
                      </Button>
                      {room.updated && (
                        <p>
                          Updated at:{" "}
                          {new Date(room.updated).toLocaleDateString()}{" "}
                          {new Date(room.updated).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          ))}
        </div>

        <div className="px-3">
          <Button
            className="text-white"
            disabled={progress < rooms.length}
            onClick={() => {
              allChecked();
            }}
          >
            Finish Walkthrough
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}

export default page;
