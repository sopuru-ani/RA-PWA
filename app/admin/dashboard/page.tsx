"use client";

import React from "react";
import { User } from "lucide-react";
import { redirect } from "next/navigation";

function page() {
  return (
    <>
      <div>
        <button
          className="flex flex-row gap-1 items-center justify-center px-3 py-2 rounded-md bg-primary hover:bg-primary-hover hover:cursor-pointer"
          onClick={() => redirect("/admin/staff/new")}
        >
          <User className="w-4 h-4" />
          Add New Staff
        </button>
      </div>
    </>
  );
}

export default page;
