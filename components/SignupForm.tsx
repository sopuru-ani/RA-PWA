// components/SignupForm.tsx
"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { useState, Dispatch, SetStateAction } from "react";
import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/api-client";

interface Props {
  setLoading: Dispatch<SetStateAction<boolean>>;
  loading: boolean;

  show: (notif: {
    msg: string;
    type?: "error" | "success" | "neutral";
    closable?: boolean;
    duration?: number | null;
  }) => void;
}

function SignupForm({ setLoading, loading, show }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function signup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    let keepLoading = false;

    try {
      const response = await apiFetch("api/auth/signup", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          confirmPassword,
          studentId,
          firstName,
          lastName,
        }),
      });

      let result: { msg?: string } = {};
      try {
        result = await response.json();
      } catch {
        result = { msg: "Unexpected server response" };
      }

      if (response.ok) {
        keepLoading = true;

        show({
          msg: result.msg ?? "Signup successful",
          duration: 1500,
          type: "success",
        });

        setTimeout(() => {
          setLoading(false);
          redirect("/ra/dashboard");
        }, 1500);
      } else {
        show({
          msg: result.msg ?? "Signup failed",
          type: "error",
          closable: true,
          duration: null,
        });
      }
    } catch (err) {
      console.error("Signup request failed", err);

      show({
        msg: "Network or server error. Please try again.",
        type: "error",
        closable: true,
        duration: null,
      });
    } finally {
      if (!keepLoading) {
        setLoading(false);
      }
    }
  }

  return (
    <form onSubmit={signup}>
      <div className="flex flex-col gap-6">
        <div className="flex gap-3 max-w-full">
          <div className="grid gap-2 flex-1">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="Jane"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          <div className="grid gap-2 flex-1">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Doe"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="studentId">Student ID</Label>
          <Input
            id="studentId"
            type="text"
            required
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          />
        </div>

        <div className="flex flex-row gap-3">
          <div className="grid gap-2 flex-1">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
            </div>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="grid gap-2 flex-1">
            <div className="flex items-center">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
            </div>
            <Input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full text-white mt-4"
        disabled={loading}
      >
        {loading ? "..." : "Signup"}
      </Button>
    </form>
  );
}

export default SignupForm;
