"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import AlertComp from "@/components/AlertComp";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import SignupForm from "@/components/SignupForm";

function SignUp() {
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  return (
    <div className="flex justify-center items-center p-4 h-dvh">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Sign Up to go to your dashboard</CardTitle>
          <CardDescription>Fill in your details blah blah blah</CardDescription>
          {success && (
            <AlertComp
              title={msg}
              description={"Redirecting to dashboard..."}
              variant={"success"}
            />
          )}
          {error && (
            <AlertComp
              title={"Error"}
              description={msg}
              variant={"destructive"}
            />
          )}
        </CardHeader>
        <CardContent>
          <SignupForm
            setSuccess={setSuccess}
            setError={setError}
            setMsg={setMsg}
            setLoading={setLoading}
            loading={loading}
          />
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <CardDescription>
            Already have an account?{" "}
            <Link href="/login" className="text-primary">
              login
            </Link>
          </CardDescription>
        </CardFooter>
      </Card>
    </div>
  );
}

export default SignUp;
