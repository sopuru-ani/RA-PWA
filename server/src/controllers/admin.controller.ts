import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { connectDB } from "../lib/connect.js";
import { getTokenFromRequest } from "../lib/token.js";
import {
  User,
  Resident,
  AuthorizedUser,
  SectionStaff,
} from "../lib/models.js";

export async function addAllowedUser(
  req: Request,
  res: Response,
): Promise<void> {
  await connectDB();
  const body = req.body;

  try {
    const allowed = await AuthorizedUser.create({
      email: body.email,
      role: body.role,
      isActive: body.isActive,
      community: body.community,
      assignment: body.assignment,
      notes: body.notes,
    });
    res
      .status(200)
      .json({ msg: `${allowed.role} successfully added`, response: allowed });
  } catch (error: unknown) {
    res.status(500).json({
      msg: "Error adding staff",
      error: error instanceof Error ? error.message : "Unknown",
    });
  }
}

export async function seedResidents(
  req: Request,
  res: Response,
): Promise<void> {
  await connectDB();

  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      res.status(401).json({ msg: "Unauthorized" });
      return;
    }

    const decoded = jwt.verify(token, env.jwtSecret) as { userId: string };
    const dbUser = await User.findById(decoded.userId);

    if (!dbUser) {
      res.status(401).json({ msg: "Unauthorized" });
      return;
    }

    if (dbUser.role !== "Admin") {
      res.status(403).json({ msg: dbUser.role });
      return;
    }

    const residents = req.body;

    if (!Array.isArray(residents) || residents.length === 0) {
      res.status(400).json({
        msg: "Invalid payload: expected a non-empty array",
      });
      return;
    }

    const uniquePairs = [
      ...new Map(
        residents.map((r: { community: string; section: string }) => [
          `${r.community}__${r.section}`,
          { community: r.community, section: r.section },
        ]),
      ).values(),
    ];

    const staffRecords = await SectionStaff.find({
      $or: uniquePairs.map(({ community, section }) => ({
        community,
        section,
      })),
    }).lean();

    const staffMap = new Map<
      string,
      { raEmail: string; gaEmail: string }
    >(
      staffRecords.map((s) => {
        const row = s as unknown as {
          community: string;
          section: string;
          raEmail: string;
          gaEmail: string;
        };
        return [
          `${row.community}__${row.section}`,
          { raEmail: row.raEmail, gaEmail: row.gaEmail },
        ] as const;
      }),
    );

    const missingStaff: {
      index: number;
      community: string;
      section: string;
    }[] = [];

    const docs = residents.map(
      (
        r: {
          community: string;
          section: string;
          fullName?: string;
          firstName?: string;
          lastName?: string;
          raEmail?: string;
          gaEmail?: string;
          [key: string]: unknown;
        },
        i: number,
      ) => {
        const key = `${r.community}__${r.section}`;
        const staff = staffMap.get(key);

        if (!staff) {
          missingStaff.push({
            index: i,
            community: r.community,
            section: r.section,
          });
        }

        return {
          ...r,
          fullName:
            r.fullName ||
            `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim(),
          raEmail: r.raEmail || staff?.raEmail || "",
          gaEmail: r.gaEmail || staff?.gaEmail || "",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      },
    );

    if (missingStaff.length > 0) {
      res.status(422).json({
        msg: "Some rows reference a community/section with no staff record in the database. Add the missing SectionStaff entries first.",
        missingStaff,
      });
      return;
    }

    const result = await Resident.insertMany(docs, { ordered: false });

    res.status(200).json({
      msg: "Residents imported successfully",
      inserted: result.length,
    });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      "writeErrors" in (error as object) &&
      "insertedDocs" in (error as object)
    ) {
      const bulkError = error as {
        insertedDocs?: unknown[];
        writeErrors?: { index: number; errmsg: string }[];
      };
      res.status(207).json({
        msg: "Partial import — some rows failed",
        inserted: bulkError.insertedDocs?.length ?? 0,
        failed: bulkError.writeErrors?.length ?? 0,
        errors: bulkError.writeErrors?.map((e) => ({
          index: e.index,
          message: e.errmsg,
        })),
      });
      return;
    }

    res.status(500).json({
      msg: "Error importing residents",
      error: error instanceof Error ? error.message : "Unknown",
    });
  }
}
