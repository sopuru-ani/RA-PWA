"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface DeleteIncidentPopUpProps {
  incidentId: string;
  onSuccess: () => void;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL_LAN;
function DeleteIncidentPopUp({
  incidentId,
  onSuccess,
}: DeleteIncidentPopUpProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}api/incidents`, {
        method: "DELETE",
        credentials: "include",
        body: JSON.stringify({ incidentId: incidentId }),
      });

      const data = await res.json();

      if (res.status === 401) {
        router.replace("/login");
        return;
      }

      if (!res.ok) {
        window.location.reload();
        console.error("Failed to delete incident:", data?.msg ?? data);
        setLoading(false);
        router.refresh();
        return;
      }

      setLoading(false);
      onSuccess();
    } catch (err) {
      console.error("Error deleting incident:", err);
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          className="absolute bottom-2 left-2 rounded-md p-2 text-red-300 hover:bg-red-300 hover:text-red-800 transition cursor-pointer"
          aria-label="Edit incident"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete incident?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this incident? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {loading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DeleteIncidentPopUp;
