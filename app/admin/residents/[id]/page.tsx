"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import ListSkeleton from "@/components/housing/ListSkeleton";
import type { ResidentWithStaff } from "@/types/admin";

export default function AdminResidentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [resident, setResident] = useState<ResidentWithStaff | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await apiFetch(`api/admin/residents/${id}`, { method: "GET" });
      const data = await res.json();
      if (res.ok) setResident(data.resident);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <ListSkeleton rows={3} />;
  if (!resident) {
    return <p className="text-sm text-muted-foreground">Resident not found.</p>;
  }

  return (
    <div className="flex flex-col space-y-4 pb-4 mx-3 h-full">
      <Link
        href="/admin/residents"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All residents
      </Link>

      <div>
        <h1 className="text-xl font-semibold">{resident.fullName}</h1>
        <p className="text-sm text-muted-foreground">
          {resident.community} · {resident.section} · Room {resident.room}
        </p>
      </div>

      <Card>
        <CardContent className="py-4 space-y-2 text-sm">
          <p>
            <span className="font-medium">Email:</span> {resident.email}
          </p>
          <p>
            <span className="font-medium">Student ID:</span>{" "}
            {resident.studentId}
          </p>
          {resident.raEmail ? (
            <p>
              <span className="font-medium">RA:</span> {resident.raEmail}
            </p>
          ) : null}
          {resident.gaEmail ? (
            <p>
              <span className="font-medium">Area Director:</span>{" "}
              {resident.gaEmail}
            </p>
          ) : null}
          {resident.notes ? (
            <p>
              <span className="font-medium">Notes:</span> {resident.notes}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
