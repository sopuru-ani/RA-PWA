import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/connect";
import User from "@/db/user.model";

const secretKey = process.env.JWT_SECRET!;

export async function GET(req: NextRequest) {
  await connectDB();

  const token = req.cookies.get("token")?.value;

  // No token → not authenticated
  if (!token) {
    return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
  }

  try {
    // Verify token (will throw if invalid/expired)
    const decoded = jwt.verify(token, secretKey) as { userId: string };

    const dbUser = await User.findById(decoded.userId).lean();
    if (!dbUser) {
      return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
    }

    // Minimal payload for the client; adjust as needed
    const user = {
      id: dbUser._id.toString(),
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      role: dbUser.role,
      community: dbUser.community,
      assignment: dbUser.assignment,
    };

    return NextResponse.json({ authenticated: true, user }, { status: 200 });
  } catch (err) {
    // JWT invalid/expired → unauthorized
    if (
      err instanceof jwt.JsonWebTokenError ||
      err instanceof jwt.TokenExpiredError
    ) {
      return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
    }

    // Other errors → 500
    // console.error("Error in /api/auth/verify:", err);
    return NextResponse.json(
      {
        msg: "Internal Server Error",
        error: err instanceof Error ? err.message : "Unknown Error",
      },
      { status: 500 }
    );
  }
}
