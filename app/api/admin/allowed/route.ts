import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/connect";
import AuthorizedUser from "@/db/authorizedAccounts.model";

export async function POST(req: NextRequest){
    await connectDB();
    const res = await req.json();

    try {
        const allowed = await AuthorizedUser.create({ email: res.email, role: res.role, isActive: res.isActive, community: res.community, assignment: res.assignment, notes: res.notes});
    return NextResponse.json({ msg: `${allowed.role} successfully added`, response: allowed }, { status: 200 });
    } catch (error: unknown) {
        return NextResponse.json(
      { msg: "Error adding staff", error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
    }
    
}