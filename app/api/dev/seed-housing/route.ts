import { NextRequest, NextResponse } from "next/server";
import Community from "@/db/community.models";

import connectDB from "@/lib/connect";

export async function POST(req: NextRequest) {
    await connectDB();
    const { community, section } = await req.json();
    if (!community) return NextResponse.json({ msg: "Please specify a community" }, { status: 400 });
    const newCommunity = await Community.create({ community: community, section: section });
    return NextResponse.json({ msg: "successful creation", data: newCommunity }, { status: 200 });
}