"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Plus, ClipboardCheck } from "lucide-react";

import Link from "next/link";

import { useResidents } from "@/context/RAResidentProvider";
import { RoomcheckLean, InspectionSession } from "@/db/roomcheck.model";
import Walkthroughs from "@/components/RA/Inspections/Walkthroughs";

import RADashboardSkeleton from "@/components/RA/RADashboardSkeleton";
import Empty from "@/components/RA/Empty";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL_LAN;
function page() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [empty, setEmpty] = useState<boolean>(false);
  const {
    sessionId,
    walkthroughs,
  }: { sessionId: string | null; walkthroughs: InspectionSession[] } =
    useResidents();

  if (walkthroughs.length < 1) setEmpty(true);
  let isResumeSession = false;
  if (sessionId) {
    isResumeSession = true;
  }
  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch(`${BASE_URL}api/auth/verify`, {
          method: "GET",
          credentials: "include",
        });

        if (res.status === 401) {
          router.replace("/login");
          return;
        }

        // Optionally, you can read the user from here if you want
        // const data = await res.json();

        setCheckingAuth(false);
      } catch (err) {
        console.error("Auth check failed", err);
        router.replace("/login");
      }
    };

    verify();
  }, [router]);

  if (checkingAuth) {
    // simple loading state while verifying access
    return <RADashboardSkeleton />;
  }
  return (
    <div className="flex flex-col h-dvh">
      <div className="mb-2 mx-3">
        {/* <Button className="text-white bg-orange-500">
          Finish Last Inspection Session
        </Button> */}
        <Link href="/ra/inspectionSession">
          <Button
            className={
              isResumeSession ? "bg-orange-500 text-white" : "text-white"
            }
          >
            {isResumeSession
              ? "Resume Inspection Session"
              : "New Inspection Session"}
          </Button>
        </Link>
      </div>
      {empty ? (
        <Empty
          message="No walkthroughs yet"
          description="Once inspections are completed, they’ll appear here."
          icon={<ClipboardCheck className="h-6 w-6" />}
        />
      ) : (
        <ScrollArea className="flex-1 overflow-y-auto rounded-xs">
          <div className="flex flex-col gap-1 mx-3 pb-1">
            {walkthroughs.map((w) => (
              <Walkthroughs key={w.inspectionSession} w={w} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

export default page;
