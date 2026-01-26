import { NextRequest, NextResponse } from "next/server";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import connectDB from "@/lib/connect";
import User from "@/db/user.model";

const secretKey = process.env.JWT_SECRET!;
const exp = process.env.JWT_LIMIT!;
export async function POST(req: NextRequest) {
    await connectDB();
    const res = await req.json();
    if (!res.email || !res.password) return NextResponse.json({ msg: 'Email and Password fields are required' }, { status: 400 });
    const user = await User.findOne({ email: res.email });

    if (!user) return NextResponse.json({ msg: 'Account does not exist' }, { status: 404 });
    try {
        const validPassword = await bcrypt.compare(res.password, user.hashedPassword);
        if (!validPassword) return NextResponse.json({ msg: 'Invalid Password' }, { status: 400 });
        const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: exp });
        
        const response = NextResponse.json({ msg: 'Login Successful' }, { status: 200 });

        // set the cookie on the response object
        response.cookies.set('token', token, {
            httpOnly: true,
            secure: true,          // works since you said your dev server is HTTPS
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 // 7 days
        });

        return response;
    } catch (error: unknown) {
        return NextResponse.json({ msg: 'Internal Server Error', error: error instanceof Error ? error.message : 'Unknown Error'}, { status: 500 });
    }
}