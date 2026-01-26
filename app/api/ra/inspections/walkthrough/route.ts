import { NextRequest, NextResponse } from "next/server";
import jwt from 'jsonwebtoken';

import connectDB from "@/lib/connect";
import User from "@/db/user.model";
import Roomcheck, { RoomcheckLean } from "@/db/roomcheck.model";

const secretKey = process.env.JWT_SECRET!;
export async function POST(req: NextRequest) {
    await connectDB();
    try {
        const token = req.cookies.get("token")?.value;
        if (!token) {
            return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
        }
        const user = jwt.verify(token, secretKey) as { userId: string };
        const dbUser = await User.findById(user.userId);
        if (!dbUser) return NextResponse.json({ msg: 'Unauthorized' }, { status: 401 });
        const { sessionId } = await req.json();
        const roomsChecked = await Roomcheck.find({ inspectionSession: sessionId, community: dbUser.community[0], section: dbUser.assignment[0] }).lean<RoomcheckLean[]>();
        return NextResponse.json({ msg: 'Residents fetched successfully!', roomsChecked: roomsChecked }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ msg: 'Internal Server Error', error: error instanceof Error ? error.message : 'Unknown Error'}, { status: 500 });
    }
}