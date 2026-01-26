import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ msg: "Logout successful" }, { status: 200 });

  // This is the semantic "clear" in Next.js
  res.cookies.delete("token");

  return res;
}
