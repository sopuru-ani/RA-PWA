"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AccordionTrigger,
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

import { InspectionSession, RoomcheckLean } from "@/db/roomcheck.model";

import { Plus, ArrowLeft, ChevronDownIcon } from "lucide-react";
import Spinner from "@/components/RA/Spinner";

interface Props {
  w: InspectionSession;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL_LAN;
function Walkthroughs({ w }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [walkthroughData, setWalkthroughData] = useState<RoomcheckLean[]>([]);
  useEffect(() => {
    if (!open) return;
    async function getWalkthroughs() {
      setLoading(true);
      try {
        const response = await fetch(
          `${BASE_URL}api/ra/inspections/walkthrough`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ sessionId: w.inspectionSession }),
          },
        );

        const {
          msg,
          roomsChecked,
        }: { msg: string; roomsChecked: RoomcheckLean[] } =
          await response.json();

        if (response.status === 401) {
          router.replace("/login");
        }
        if (!response.ok) {
          console.error(msg);
          setOpen(false);
          return;
        }
        setWalkthroughData(
          [...roomsChecked].sort((a, b) => a.room.localeCompare(b.room)),
        );
      } catch (err) {
        console.error("Error fetching walkthrough session", err);
      } finally {
        setLoading(false);
      }
    }
    getWalkthroughs();
  }, [open, w.inspectionSession]);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Card className="px-3 py-1 md:border-0 md:border-b md:shadow-none md:rounded-none cursor-pointer hover:bg-muted/50 transition">
            <CardContent className="flex items-center justify-between py-3 px-2">
              {/* Left */}
              <div className="flex flex-col">
                <h3 className="text-sm font-medium">{w.title}</h3>
                <p className="text-xs text-muted-foreground">
                  Inspection walkthrough
                </p>
              </div>

              {/* Right */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {w.completedRooms}/{w.totalRooms}
                </span>
                <span className="text-xs text-muted-foreground">checked</span>
              </div>
            </CardContent>
          </Card>
        </DialogTrigger>

        <DialogContent
          className="flex flex-col h-[calc(100dvh-2rem)] min-w-[calc(100dvw-2rem)] content-start gap-0 px-3 md:px-6"
          onInteractOutside={(e) => {
            e.preventDefault();
          }}
        >
          <div className="w-full flex flex-row items-center gap-3">
            <DialogClose asChild className="w-fit h-fit p-0 rounded-full m-0">
              <ArrowLeft className="w-8 h-8 rounded-full bg-gray-200 dark:bg-popover p-1" />
            </DialogClose>
            <DialogTitle>{w.title || "Week of ..."}</DialogTitle>
          </div>
          <Separator className="my-3" />

          {/* Dialog body */}
          {loading ? (
            <Spinner />
          ) : (
            <ScrollArea className="flex-1 overflow-y-auto rounded-xs ">
              <div className="flex flex-col gap-2 pr-3 pb-2">
                {walkthroughData.map((room, i) => (
                  <Card
                    className="rounded-2xl shadow-sm py-2 px-1 md:border-0 md:border-b md:shadow-none md:rounded-none"
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
                          <div className="space-y-4">
                            {room.residents.map((resident, i) => (
                              <div
                                key={i}
                                className="rounded-xl border bg-muted/40 px-4 py-3"
                              >
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-medium">
                                    {resident.name}
                                  </h4>

                                  <span
                                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                      resident.isPass
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700"
                                    }`}
                                  >
                                    {resident.isPass ? "Passed" : "Failed"}
                                  </span>
                                </div>

                                <p className="mt-2 text-sm text-muted-foreground">
                                  <span className="font-medium text-foreground">
                                    Notes:
                                  </span>{" "}
                                  {resident.notes || "N/A"}
                                </p>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default Walkthroughs;
