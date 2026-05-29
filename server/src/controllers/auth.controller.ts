import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { connectDB } from "../lib/connect.js";
import { getTokenFromRequest } from "../lib/token.js";
import { User, AuthorizedUser } from "../lib/models.js";

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function login(req: Request, res: Response): Promise<void> {
  await connectDB();
  const { email, password } = req.body;

  if (!email || !password) {
    res
      .status(400)
      .json({ msg: "Email and Password fields are required" });
    return;
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(404).json({ msg: "Account does not exist" });
    return;
  }

  try {
    const validPassword = await bcrypt.compare(password, user.hashedPassword);
    if (!validPassword) {
      res.status(400).json({ msg: "Invalid Password" });
      return;
    }

    const token = jwt.sign(
      { userId: user._id },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"] },
    );

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: env.cookieSecure,
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE_MS,
      })
      .status(200)
      .json({ msg: "Login Successful", role: user.role, token });
  } catch (error: unknown) {
    res.status(500).json({
      msg: "Internal Server Error",
      error: error instanceof Error ? error.message : "Unknown Error",
    });
  }
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  await connectDB();
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ msg: "Email field is required" });
    return;
  }

  const userAllowed = await AuthorizedUser.findOne({ email });
  if (!userAllowed) {
    res.status(401).json({ msg: "You aren't authorized to sign up" });
    return;
  }

  const user = await User.findOne({ email });
  if (user) {
    res.status(400).json({ msg: "Account already exists" });
    return;
  }
  res.status(200).json({ msg: "Email is valid" });
}

export async function signup(req: Request, res: Response): Promise<void> {
  await connectDB();
  const body = req.body;

  const userAllowed = await AuthorizedUser.findOne({ email: body.email });
  if (!userAllowed) {
    res.status(401).json({ msg: "unauthorized" });
    return;
  }

  if ((userAllowed.role === "RA" || userAllowed.role === "SA") && !body.studentId) {
    res
      .status(400)
      .json({ msg: "Please provide your student ID" });
    return;
  }

  const checkEmail = await User.findOne({ email: body.email });
  if (checkEmail) {
    res
      .status(400)
      .json({ msg: "This email is already tied to an account" });
    return;
  }

  const checkId = await User.findOne({ studentId: body.studentId });
  if (checkId) {
    res
      .status(400)
      .json({ msg: "This student id is already tied to an account" });
    return;
  }

  if (!body.password || !body.confirmPassword) {
    res.status(400).json({ msg: "Both Password fields are required" });
    return;
  }

  if (body.password !== body.confirmPassword) {
    res.status(400).json({ msg: "The passwords do not match" });
    return;
  }

  try {
    const fullName = `${body.firstName} ${body.lastName}`;
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(body.password, salt);

    const newUser = await User.create({
      fullName,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      hashedPassword,
      ...(body.studentId && { studentId: body.studentId }),
      role: userAllowed.role,
      authProvider: "local",
      community: userAllowed.community,
      assignment: userAllowed.assignment,
    });

    const token = jwt.sign(
      { userId: newUser._id },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"] },
    );

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: env.cookieSecure,
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE_MS,
      })
      .status(200)
      .json({ msg: "successful signup", role: newUser.role, token });
  } catch (error: unknown) {
    res.status(500).json({
      msg: "Internal Server Error",
      error: error instanceof Error ? error.message : "Unknown Error",
    });
  }
}

/** Debug endpoint preserved from the original signup route GET handler */
export async function signupDebugGet(
  _req: Request,
  res: Response,
): Promise<void> {
  await connectDB();
  const foundUser = await User.findOne({ _id: "69501def890d172a2ecdff75" });
  res.status(200).json({ user: foundUser });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie("token");
  res.status(200).json({ msg: "Logout successful" });
}

export async function verify(req: Request, res: Response): Promise<void> {
  await connectDB();

  const token = getTokenFromRequest(req);
  if (!token) {
    res.status(401).json({ msg: "Unauthorized" });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as { userId: string };
    const dbUser = await User.findById(decoded.userId).lean();

    if (!dbUser) {
      res.status(401).json({ msg: "Unauthorized" });
      return;
    }

    const user = {
      id: dbUser._id.toString(),
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      role: dbUser.role,
      community: dbUser.community ?? null,
      assignment: dbUser.assignment ?? null,
    };

    res.status(200).json({ authenticated: true, user });
  } catch (err) {
    if (
      err instanceof jwt.JsonWebTokenError ||
      err instanceof jwt.TokenExpiredError
    ) {
      res.status(401).json({ msg: "Unauthorized" });
      return;
    }

    res.status(500).json({
      msg: "Internal Server Error",
      error: err instanceof Error ? err.message : "Unknown Error",
    });
  }
}
