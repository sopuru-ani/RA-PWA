"use client";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api-client";
import { useNotification } from "@/context/notification-context";

function page() {
  const { show } = useNotification();
  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);
  const [community, setCommunity] = useState<string[]>([]);
  const [assignment, setAssignment] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  async function addStaff() {
    try {
      const response = await apiFetch("api/admin/allowed", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email,
          role,
          isActive,
          community,
          assignment,
          notes,
        }),
      });

      let result: { msg?: string; respone?: string } = {};

      try {
        result = await response.json();
      } catch {
        result = {
          msg: "Unexpected server response",
        };
      }

      if (response.ok) {
        show({
          msg: result.msg ?? "Staff added successfully",
          duration: 1500,
          type: "success",
        });
      } else {
        show({
          msg: result.msg ?? "Error adding staff",
          type: "error",
          closable: true,
          duration: null,
        });
      }
    } catch (error) {
      show({
        msg: "Network or server error. Please try again.",
        type: "error",
        closable: true,
        duration: null,
      });
    }
  }

  return (
    <>
      <div className="px-2 py-2 flex-1 overflow-y-auto">
        <p className="text-2xl">New Staff Details</p>

        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Label htmlFor="role">Role</Label>
        <Input
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />

        <Label htmlFor="isActive">Is this Staff Active?</Label>
        <RadioGroup
          value={String(isActive)}
          onValueChange={(v) => setIsActive(v === "true")}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem id="active" value="true" />
            <label htmlFor="active">Active</label>

            <RadioGroupItem id="inactive" value="false" />
            <label htmlFor="inactive">Inactive</label>
          </div>
        </RadioGroup>

        <Label htmlFor="community">Community</Label>
        <Input
          id="community"
          value={community[0] ?? ""}
          onChange={(e) => setCommunity([e.target.value])}
        />

        <Label htmlFor="assignment">assignment within the community</Label>
        <Input
          id="assignment"
          value={assignment[0] ?? ""}
          onChange={(e) => setAssignment([e.target.value])}
        />

        <Label htmlFor="notes">
          Comments/Notes <span className="text-gray-500">(optional)</span>
        </Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button
          className="flex flex-row gap-1 items-center justify-center px-3 py-2 rounded-md bg-primary hover:bg-primary-hover hover:cursor-pointer"
          onClick={() => addStaff()}
        >
          Add Staff
        </button>
      </div>
    </>
  );
}

export default page;
