import { NextRequest, NextResponse } from "next/server";
import jwt from 'jsonwebtoken';

import connectDB from "@/lib/connect";
import User from "@/db/user.model";

const secretKey = process.env.JWT_SECRET!;
export async function GET(req: NextRequest) {
    await connectDB();
    try {
        const token = req.cookies.get('token')?.value;
        const user = jwt.verify(token, secretKey) as { userId: string };
        const dbUser = await User.findById(user.userId);
        if (dbUser) return NextResponse.json({ msg: 'found', user: dbUser }, { status: 200 });
        return NextResponse.json({ msg: 'not found' }, { status: 404 });
    } catch (error) {
        return NextResponse.json({ msg: 'Internal Server Error', error: error instanceof Error ? error.message : 'Unknown Error'}, { status: 500 });
    }
}