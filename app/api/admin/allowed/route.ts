import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/connect";
import AuthorizedUser from "@/db/authorizedAccounts.model";

export async function POST(req: NextRequest){
    await connectDB();
    const res = await req.json();

    const allowed = await AuthorizedUser.create({ email: res.email, role: res.role, isActive: res.isActive, notes: res.notes});
    return NextResponse.json({ msg: `${allowed.role} successfully added`, response: allowed }, { status: 200 });
}