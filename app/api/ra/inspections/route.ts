import { NextRequest, NextResponse } from "next/server";
import jwt from 'jsonwebtoken';

import connectDB from "@/lib/connect";
import User from "@/db/user.model";
import Resident, { ResidentLean } from "@/db/resident.model";
import Room, { RoomLean } from "@/db/room.model";
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
        const sendUser = {
            firstName: dbUser.firstName,
            lastName: dbUser.lastName,
            assignment: dbUser.assignment,
            community: dbUser.community,
            role: dbUser.role,
        }
        const resident = await Resident.find({ community: dbUser.community[0], section: dbUser.assignment[0] }).lean<ResidentLean[]>();
        const room = await Room.find({ community: dbUser.community[0], section: dbUser.assignment[0] }).sort({ room: 1 }).lean<RoomLean[]>();
        const getSession = await Roomcheck.findOne({ sessionStatus: "in_progress", community: dbUser.community[0], section: dbUser.assignment[0] }).lean<RoomcheckLean>();
        const roomsChecked = await Roomcheck.find({ inspectionSession: getSession?.inspectionSession, community: dbUser.community[0], section: dbUser.assignment[0] }).lean<RoomcheckLean[]>();
        return NextResponse.json({ msg: 'Residents fetched successfully!', residents: resident, rooms: room, roomsChecked: roomsChecked, user: sendUser }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ msg: 'Internal Server Error', error: error instanceof Error ? error.message : 'Unknown Error'}, { status: 500 });
    }
}