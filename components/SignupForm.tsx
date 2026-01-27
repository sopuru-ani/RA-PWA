// components/SignupForm.tsx
"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { useState, Dispatch, SetStateAction } from "react";
import { redirect } from "next/navigation";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL_LAN;

interface Props {
  setSuccess: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<boolean>>;
  setMsg: Dispatch<SetStateAction<string>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  loading: boolean;
}

function SignupForm({
  setSuccess,
  setError,
  setMsg,
  setLoading,
  loading,
}: Props) {
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
      const response = await fetch(`${BASE_URL}api/auth/signup`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        credentials: "include",
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
        // In case the server returns a non-JSON error response
        result = { msg: "Unexpected server response" };
      }

      if (response.ok) {
        keepLoading = true;
        setSuccess(true);
        setError(false);
        setMsg(result.msg ?? "Signup successful");
        setTimeout(() => {
          setLoading(false);
          redirect("/ra/dashboard");
        }, 1500);
      } else {
        setSuccess(false);
        setError(true);
        setMsg(result.msg ?? "Signup failed");
      }
    } catch (err) {
      console.error("Signup request failed", err);
      setSuccess(false);
      setError(true);
      setMsg("Network or server error. Please try again.");
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
