"use client";
import { useState } from "react";
import Link from "next/link";

import { ArrowLeft } from "lucide-react";
import Spinner from "@/components/RA/Spinner";
import { useVerifyAuth } from "@/hooks/useVerifyAuth";
function page() {
  const checkingAuth = useVerifyAuth();
  const [firstName, setFirstName] = useState("");

  if (checkingAuth) {
    return (
      <div className="h-dvh">
        <Spinner />
      </div>
    );
  }
  return (
    <>
      <div className="h-dvh">
        <Spinner />
      </div>
    </>
  );
}

export default page;
