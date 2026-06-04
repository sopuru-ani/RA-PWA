import { NextRequest, NextResponse } from "next/server";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import connectDB from "@/lib/connect";
import User from "@/db/user.model";
import AuthorizedUser from "@/db/authorizedAccounts.model";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days


export async function POST(req: NextRequest) {
    await connectDB();
    const res = await req.json();
    const userAllowed = await AuthorizedUser.findOne({ email: res.email });

    if (!userAllowed) return NextResponse.json({ msg: 'unauthorized' }, { status: 401 });

    if ((userAllowed.role === 'RA' || userAllowed.role === 'SA') && !res.studentId) {
        return NextResponse.json({ msg: 'Please provide your student ID' }, { status: 400 });
    }
    const checkEmail = await User.findOne({ email: res.email });
    if (checkEmail) return NextResponse.json({ msg: 'This email is already tied to an account' }, { status: 400 });

    const checkId = await User.findOne({ studentId: res.studentId });
    if (checkId) return NextResponse.json({ msg: 'This student id is already tied to an account' }, { status: 400 });

    if (!res.password || !res.confirmPassword) return NextResponse.json({ msg: 'Both Password fields are required' }, { status: 400 });
    if (res.password !== res.confirmPassword) return NextResponse.json({ msg: 'The passwords do not match' }, { status: 400 });

    try {
        const fullName = `${res.firstName} ${res.lastName}`;
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(res.password, salt);

        const newUser = (await User.create({ fullName: fullName, firstName: res.firstName, lastName: res.lastName, email: res.email, hashedPassword: hashedPassword, ...(res.studentId && { studentId: res.studentId }), role: userAllowed.role, authProvider: 'local', community: userAllowed.community, assignment: userAllowed.assignment })) as typeof User.prototype;

        const token = jwt.sign(
            { userId: newUser._id },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        const response = NextResponse.json({ msg: 'successful signup', role: newUser.role, token }, { status: 200 });
        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: COOKIE_MAX_AGE_MS,
        });

        return response;
    } catch (error: unknown) {
        return NextResponse.json({ msg: 'Internal Server Error', error: error instanceof Error ? error.message : 'Unknown Error' }, { status: 500 });
    }
    
};

export async function GET() {
    await connectDB();
    const foundUser = await User.findOne({ _id: "69501def890d172a2ecdff75" });

    return NextResponse.json({ user: foundUser }, { status: 200 });
}