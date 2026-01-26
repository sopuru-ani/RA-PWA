"use client";

import { useState } from "react";

import AlertComp from "@/components/AlertComp";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

import LoginForm from "@/components/LoginForm";

function Login() {
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  return (
    <div className="flex justify-center items-center p-4 h-dvh">
      <Card className="w-full max-w-sm gap-2">
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
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
        <CardContent className="mt-4">
          <LoginForm
            setSuccess={setSuccess}
            setError={setError}
            setMsg={setMsg}
            setLoading={setLoading}
            loading={loading}
          />
        </CardContent>
        <CardFooter className="flex-col">
          {/* <Button type="submit" className="w-full text-white">
            Login
          </Button> */}
          <CardDescription className="">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary">
              sign up
            </Link>
          </CardDescription>
        </CardFooter>
      </Card>
    </div>
  );
}

export default Login;
