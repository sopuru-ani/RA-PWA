import { NextRequest, NextResponse } from "next/server";
import jwt from 'jsonwebtoken';

import connectDB from "@/lib/connect";
import User from "@/db/user.model";
import Resident, { ResidentLean } from "@/db/resident.model";
import Room, { RoomLean } from "@/db/room.model";
import Community, { CommunityLean } from "@/db/community.models";
import Incident, { IncidentLean } from "@/db/incident.model";
import Roomcheck, { RoomcheckLean } from "@/db/roomcheck.model";

const secretKey = process.env.JWT_SECRET!;
export async function GET(req: NextRequest) {
    await connectDB();
    try {
        const token = req.cookies.get("token")?.value;
        if (!token) {
            return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
        }
        const user = jwt.verify(token, secretKey) as { userId: string };
        const dbUser = await User.findById(user.userId);
        if (!dbUser) return NextResponse.json({ msg: 'Unauthorized' }, { status: 401 });
        // const { sessionId } = await req.json();
        const sendUser = {
            firstName: dbUser.firstName,
            lastName: dbUser.lastName,
            assignment: dbUser.assignment,
            community: dbUser.community,
            role: dbUser.role,
        }
        
        const resident = await Resident.find({ community: dbUser.community[0] }).lean<ResidentLean[]>();
        const room = await Room.find({ community: dbUser.community[0] }).lean<RoomLean[]>();
        const community = await Community.find({ community: dbUser.community[0]}).lean<CommunityLean[]>();
        const incidents = await Incident.find({ community: dbUser.community[0] }).lean<IncidentLean[]>();
        // const roomsChecked = await Roomcheck.find({ inspectionSession: sessionId, community: dbUser.community[0], section: dbUser.assignment[0] }).lean<RoomcheckLean[]>();
        const roomsChecked = await Roomcheck.findOne({ sessionStatus: "in_progress", community: dbUser.community[0], section: dbUser.assignment[0] }).lean<RoomcheckLean>();
        const walkthroughs = await Roomcheck.aggregate([
            {
                $match: {
                sessionStatus: "completed",
                community: dbUser.community[0],
                section: dbUser.assignment[0]
                }
            },
            {
                $group: {
                _id: "$inspectionSession",

                // representative fields
                inspectionSession: { $first: "$inspectionSession"},
                title: { $first: "$inspectionWeek" }, // if you store it
                inspectionDate: { $first: "$inspectionDate" },

                // counts
                totalRooms: { $sum: 1 },
                completedRooms: {
                    $sum: {
                    $cond: [{ $eq: ["$sessionStatus", "completed"] }, 1, 0]
                    }
                }
                }
            },
            {
                $project: {
                    _id: 0,
                    inspectionSession: 1,
                    title: 1,
                    inspectionDate: 1,
                    totalRooms: 1,
                    completedRooms: 1
                }
            },
            {
                $sort: { inspectionDate: -1 }
            }
        ]);
        
        return NextResponse.json({ msg: 'Residents fetched successfully!', residents: resident, rooms: room, user: sendUser, communityInfo: community, incidents: incidents, roomsChecked: roomsChecked, walkthroughs: walkthroughs }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ msg: 'Internal Server Error', error: error instanceof Error ? error.message : 'Unknown Error'}, { status: 500 });
    }
}