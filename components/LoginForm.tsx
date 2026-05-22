// components/LoginForm.tsx
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

import { useState, Dispatch, SetStateAction } from "react";
import { redirect } from "next/navigation";
import { apiFetch, setAuthToken } from "@/lib/api-client";

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

function LoginForm({ setLoading, loading, show }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hidePassword, setHidePassword] = useState(true);

  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);

    let keepLoading = false;

    try {
      const response = await apiFetch("api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      let result: { msg?: string; role?: string; token?: string } = {};

      try {
        result = await response.json();
      } catch {
        result = {
          msg: "Unexpected server response",
        };
      }

      if (response.ok) {
        keepLoading = true;

        if (result.token) {
          setAuthToken(result.token);
        }

        show({
          msg: result.msg ?? "Login Successful",
          duration: 1500,
          type: "success",
        });

        setTimeout(() => {
          setLoading(false);

          if (result.role === "Admin") {
            redirect("/admin/dashboard");
          } else {
            redirect("/ra/dashboard");
          }
        }, 1500);
      } else {
        show({
          msg: result.msg ?? "Login failed",
          type: "error",
          closable: true,
          duration: null,
        });
      }
    } catch (err) {
      console.error("Login request failed", err);

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
    <form onSubmit={login} className="-mt-3">
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
            className="px-3 py-5 text-sm"
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

          <div className="relative">
            {hidePassword ? (
              <EyeOff
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground w-5 h-5 cursor-pointer"
                onClick={() => setHidePassword(!hidePassword)}
              />
            ) : (
              <Eye
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground w-5 h-5 cursor-pointer"
                onClick={() => setHidePassword(!hidePassword)}
              />
            )}
            <Input
              id="password"
              name="password"
              type={hidePassword ? "password" : "text"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              required
              className="px-3 py-5 pr-10 text-sm"
            />
          </div>
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
