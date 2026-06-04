"use client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Calendar from "tony-calendar";
import { formatDate, formatTime } from "@/lib/formatters";
import "tony-calendar/dist/tony-calendar.css";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
}
function Page() {
  const [view, setView] = useState<"month" | "week">("month");
  const testEvents = [
    {
      id: "1",
      title: "RA Staff Meeting",
      date: "2026-05-28",
      startTime: "18:00",
      endTime: "19:00",
    },
    {
      id: "2",
      title: "Floor Program: Game Night",
      date: "2026-05-28",
      startTime: "20:00",
      endTime: "22:00",
    },
    {
      id: "3",
      title: "Duty Round",
      date: "2026-05-29",
      startTime: "22:00",
      endTime: "23:00",
    },
    { id: "4", title: "Resident Check-in", date: "2026-05-30" },
    {
      id: "5",
      title: "Community Builder",
      date: "2026-06-01",
      startTime: "17:00",
    },
    { id: "6", title: "Incident Report Deadline", date: "2026-06-03" },
    { id: "7", title: "One on Ones", date: "2026-06-03", startTime: "14:00" },
    {
      id: "8",
      title: "Floor Program: Movie Night",
      date: "2026-06-03",
      startTime: "19:00",
    },
    {
      id: "9",
      title: "Building Inspection",
      date: "2026-06-03",
      startTime: "10:00",
    },
    {
      id: "10",
      title: "End of Year Banquet",
      date: "2026-06-10",
      startTime: "18:00",
      endTime: "21:00",
    },
  ];
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>(
    [],
  );
  return (
    <>
      <div className="h-dvh flex flex-col-reverse md:flex-row-reverse">
        <div className="w-dvw md:flex-none md:h-dvh md:w-[30%] shrink-0 border-t-2 md:border-l md:border-t-0">
          <div className="flex flex-row justify-between items-center border-b p-3">
            <p className="text-md">Events</p>
            <Button
              onClick={() => {
                view === "month" ? setView("week") : setView("month");
              }}
              className="hover:cursor-pointer"
            >
              {view === "month" ? "Week View" : "Month View"}
            </Button>
          </div>
          <div>
            {selectedDayEvents.length > 0 ? (
              <div className="flex flex-col gap-2 p-3 overflow-y-scroll max-h-[25dvh] md:max-h-full">
                {selectedDayEvents.map((event: CalendarEvent) => (
                  <div key={event.id} className="text-sm md:text-base">
                    <p className="text-md md:text-lg font-semibold">
                      {event.title}
                    </p>
                    <p>{formatDate(event.date)}</p>
                    <p>{formatTime(event.startTime)}</p>
                    <p>{formatTime(event.endTime)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground p-3">
                Select a day to see events
              </p>
            )}
          </div>
        </div>
        <div className="flex-1 md:flex-1 min-h-0">
          <Calendar
            view={view}
            events={testEvents}
            onMoreClick={(date, events) => {
              console.log("date:", date);
              console.log("events:", events);
            }}
            onEventClick={(event) => {
              console.log("event:", event);
            }}
            onDateSelect={(date) => {
              console.log("date:", date);
              const dayEvents = testEvents.filter((e) => e.date === date);
              setSelectedDayEvents(dayEvents);
            }}
          />
        </div>
      </div>
    </>
  );
}

export default Page;
