"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import ListSkeleton from "@/components/housing/ListSkeleton";
import { roleLabelLong } from "@/lib/role-labels";
import { useParams } from "next/navigation";

export default function GAStaffDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [staff, setStaff] = useState<{
    email: string;
    fullName: string;
    role: string;
    communities: string[];
    assignments: string[];
    isActive: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await apiFetch(`api/ga/staff/${id}`, { method: "GET" });
      const data = await res.json();
      if (res.ok) setStaff(data.staff);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <ListSkeleton rows={3} />;
  if (!staff) {
    return <p className="text-sm text-muted-foreground">Staff not found.</p>;
  }

  return (
    <div className="space-y-4 pb-4 mx-3">
      <Link
        href="/ga/dashboard/staff"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Staff
      </Link>

      <div>
        <h1 className="text-xl font-semibold">{staff.fullName}</h1>
        <p className="text-sm text-muted-foreground">
          {roleLabelLong(staff.role)}
        </p>
      </div>

      <Card>
        <CardContent className="py-4 space-y-2 text-sm">
          <p>
            <span className="font-medium">Email:</span> {staff.email}
          </p>
          <p>
            <span className="font-medium">Status:</span>{" "}
            {staff.isActive ? "Active" : "Inactive"}
          </p>
          {staff.assignments.length > 0 ? (
            <p>
              <span className="font-medium">Assignment:</span>{" "}
              {staff.assignments.join(", ")}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
