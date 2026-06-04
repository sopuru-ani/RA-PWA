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
import { useNotification } from "@/context/notification-context";

interface DeleteIncidentPopUpProps {
  incidentId: string;
  onSuccess: () => void;
}

import { apiFetch } from "@/lib/api-client";
function DeleteIncidentPopUp({
  incidentId,
  onSuccess,
}: DeleteIncidentPopUpProps) {
  const router = useRouter();
  const { show } = useNotification();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("api/incidents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incidentId: incidentId }),
      });

      const data = await res.json();

      if (res.status === 401) {
        router.replace("/login");
        return;
      }

      if (!res.ok) {
        setLoading(false);
        show({
          msg: data?.msg ?? "Failed to delete incident",
          type: "error",
          closable: true,
          duration: null,
        });
        return;
      }

      setLoading(false);
      show({
        msg: data?.msg ?? "Incident deleted",
        type: "success",
        duration: 3000,
      });
      onSuccess();
    } catch (err) {
      console.error("Error deleting incident:", err);
      setLoading(false);
      show({
        msg: "Network or server error. Please try again.",
        type: "error",
        closable: true,
        duration: null,
      });
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
