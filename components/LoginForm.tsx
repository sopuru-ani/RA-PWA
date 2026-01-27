// components/LoginForm.tsx
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
function LoginForm({
  setSuccess,
  setError,
  setMsg,
  setLoading,
  loading,
}: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    let keepLoading = false;

    try {
      const response = await fetch(`${BASE_URL}api/auth/login`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
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
        setMsg(result.msg ?? "Login Successful");
        setTimeout(() => {
          setLoading(false);
          redirect("/ra/dashboard");
        }, 1500);
      } else {
        setSuccess(false);
        setError(true);
        setMsg(result.msg ?? "Login failed");
      }
    } catch (err) {
      console.error("Login request failed", err);
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
    <form onSubmit={login}>
      <div className="flex flex-col gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            required
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <a
              href="#"
              className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            required
          />
        </div>
      </div>
      <Button
        type="submit"
        className="w-full text-white mt-4"
        disabled={loading}
      >
        {loading ? "..." : "Login"}
      </Button>
    </form>
  );
}

export default LoginForm;
