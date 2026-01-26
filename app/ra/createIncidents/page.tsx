"use client";
import { useState } from "react";
import Link from "next/link";

import { ArrowLeft } from "lucide-react";
import Spinner from "@/components/RA/Spinner";
function page() {
  const [firstName, setFirstName] = useState("");
  return (
    <>
      <div className="h-dvh">
        <Spinner />
      </div>
    </>
  );
}

export default page;
