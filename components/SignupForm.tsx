// components/SignupForm.tsx
"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Eye, EyeOff, Check, X, ArrowLeftCircle } from "lucide-react";

import { useState, Dispatch, SetStateAction } from "react";
import { redirect } from "next/navigation";

import { apiFetch, setAuthToken } from "@/lib/api-client";

interface Props {
  setLoading: Dispatch<SetStateAction<boolean>>;
  loading: boolean;
  email: string;

  show: (notif: {
    msg: string;
    type?: "error" | "success" | "neutral";
    closable?: boolean;
    duration?: number | null;
  }) => void;
}

function SignupForm({ setLoading, loading, show, email }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studentId, setStudentId] = useState("");
  // const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hidePassword, setHidePassword] = useState(true);
  const [hideConfirmPassword, setHideConfirmPassword] = useState(true);
  const [hasStartedPasswordInput, setHasStartedPasswordInput] = useState(false);

  const passwordRequirements = {
    minLength: password.length >= 8,
    upperCase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    specialChar: /[^A-Za-z0-9]/.test(password),
  };

  const metRequirementsCount =
    Number(passwordRequirements.minLength) +
    Number(passwordRequirements.upperCase) +
    Number(passwordRequirements.number) +
    Number(passwordRequirements.specialChar);

  const passwordStrength = (metRequirementsCount / 4) * 100;
  const allPasswordRequirementsMet = metRequirementsCount === 4;
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const passwordBarColor =
    metRequirementsCount <= 1
      ? "bg-red-300"
      : metRequirementsCount <= 3
        ? "bg-yellow-300"
        : "bg-green-300";

  async function signup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    let keepLoading = false;

    try {
      if (!firstName || !lastName) {
        show({
          msg: "Please enter your first and last name.",
          type: "error",
          closable: true,
          duration: null,
        });
        return;
      }

      if (!email) {
        show({
          msg: "Enter your email",
          type: "error",
          closable: true,
          duration: null,
        });
        return;
      }

      if (!password) {
        show({
          msg: "Enter your password",
          type: "error",
          closable: true,
          duration: null,
        });
        return;
      }

      if (!allPasswordRequirementsMet) {
        show({
          msg: "Password does not meet all requirements",
          type: "error",
          closable: true,
          duration: null,
        });
        return;
      }

      if (!passwordsMatch) {
        show({
          msg: "Passwords do not match",
          type: "error",
          closable: true,
          duration: null,
        });
        return;
      }

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

      let result: { msg?: string; role?: string; token?: string } = {};
      try {
        result = await response.json();
      } catch {
        result = { msg: "Unexpected server response" };
      }

      if (response.ok) {
        keepLoading = true;

        if (result.token) {
          setAuthToken(result.token);
        }

        show({
          msg: result.msg ?? "Signup successful",
          duration: 1500,
          type: "success",
        });

        setTimeout(() => {
          setLoading(false);
          if (result.role === "Admin") {
            redirect("/admin/dashboard");
          } else if (result.role === "SA") {
            redirect("/sa/dashboard");
          } else if (result.role === "RA") {
            redirect("/ra/dashboard");
          } else if (result.role === "GA") {
            redirect("/ga/dashboard");
          } else {
            redirect("/login");
          }
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
    <form onSubmit={signup} noValidate>
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
              className="px-3 py-5 pr-10"
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
              className="px-3 py-5 pr-10"
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
            disabled
            // onChange={(e) => setEmail(e.target.value)}
            className="px-3 py-5 pr-10"
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
            className="px-3 py-5 pr-10"
          />
        </div>

        <div className="flex flex-col gap-3">
          <div className="grid gap-2 flex-1">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
            </div>
            <div className="relative">
              {hidePassword ? (
                <EyeOff
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5 cursor-pointer"
                  onClick={() => setHidePassword(!hidePassword)}
                />
              ) : (
                <Eye
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5 cursor-pointer"
                  onClick={() => setHidePassword(!hidePassword)}
                />
              )}
              <Input
                id="password"
                type={hidePassword ? "password" : "text"}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setHasStartedPasswordInput(true);
                }}
                className="px-3 py-5 pr-10 text-sm"
              />
            </div>
          </div>

          {hasStartedPasswordInput && (
            <>
              <Progress
                value={passwordStrength}
                barClassName={passwordBarColor}
              />
              <div className="mb-2">
                <p className="text-sm font-bold">Password must contain: </p>

                <div className="flex flex-row items-center gap-1">
                  {passwordRequirements.minLength ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <X className="w-4 h-4 text-red-600" />
                  )}
                  <p
                    className={`text-sm ${passwordRequirements.minLength ? "text-green-600" : "text-slate-500"}`}
                  >
                    At least 8 characters
                  </p>
                </div>
                <div className="flex flex-row items-center gap-1">
                  {passwordRequirements.upperCase ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <X className="w-4 h-4 text-red-600" />
                  )}
                  <p
                    className={`text-sm ${passwordRequirements.upperCase ? "text-green-600" : "text-slate-500"}`}
                  >
                    At least one capital letter
                  </p>
                </div>
                <div className="flex flex-row items-center gap-1">
                  {passwordRequirements.number ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <X className="w-4 h-4 text-red-600" />
                  )}
                  <p
                    className={`text-sm ${passwordRequirements.number ? "text-green-600" : "text-slate-500"}`}
                  >
                    At least one number
                  </p>
                </div>
                <div className="flex flex-row items-center gap-1">
                  {passwordRequirements.specialChar ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <X className="w-4 h-4 text-red-600" />
                  )}
                  <p
                    className={`text-sm ${passwordRequirements.specialChar ? "text-green-600" : "text-slate-500"}`}
                  >
                    At least one special character
                  </p>
                </div>
              </div>
            </>
          )}
          <div className="grid gap-2 flex-1">
            <div className="flex items-center">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
            </div>
            <div className="relative">
              {hideConfirmPassword ? (
                <EyeOff
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground w-5 h-5 cursor-pointer"
                  onClick={() => setHideConfirmPassword(!hideConfirmPassword)}
                />
              ) : (
                <Eye
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground w-5 h-5 cursor-pointer"
                  onClick={() => setHideConfirmPassword(!hideConfirmPassword)}
                />
              )}
              <Input
                id="confirmPassword"
                type={hideConfirmPassword ? "password" : "text"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="px-3 py-5 pr-10 text-sm"
              />
            </div>
            {confirmPassword.length > 0 && (
              <p
                className={`text-sm ${passwordsMatch ? "text-green-600" : "text-red-600"}`}
              >
                {passwordsMatch ? "Passwords match" : "Passwords do not match"}
              </p>
            )}
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full text-white mt-4 px-3 py-5 hover:cursor-pointer"
        disabled={loading}
      >
        {loading ? "..." : "Signup"}
      </Button>
    </form>
  );
}

export default SignupForm;
