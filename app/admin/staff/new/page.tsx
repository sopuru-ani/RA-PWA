"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import StaffForm from "@/components/admin/StaffForm";

export default function AdminStaffNewPage() {
  return (
    <div className="space-y-4 pb-4 max-w-lg mx-3">
      <Link
        href="/admin/staff"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to staff
      </Link>

      <div>
        <h1 className="text-xl font-semibold">Invite staff</h1>
        <p className="text-sm text-muted-foreground">
          They can sign up after you add their email
        </p>
      </div>

      <StaffForm
        mode="create"
        initial={{
          email: "",
          role: "RA",
          isActive: true,
          community: "",
          assignment: "",
          notes: "",
        }}
      />
    </div>
  );
}
