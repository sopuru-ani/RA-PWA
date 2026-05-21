import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/connect";
import User from "@/db/user.model";
import Resident from "@/db/resident.model";
import SectionStaff from "@/db/sectionStaff.model";

const secretKey = process.env.JWT_SECRET!;

export async function POST(req: NextRequest) {
  await connectDB();

  try {
    // ── Auth ──────────────────────────────────────────────
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, secretKey) as { userId: string };
    const dbUser = await User.findById(decoded.userId);

    if (!dbUser) {
      return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
    }

    if (dbUser.role !== "Admin") {
      return NextResponse.json({ msg: dbUser.role }, { status: 403 });
    }

    // ── Parse body ────────────────────────────────────────
    const residents = await req.json();

    if (!Array.isArray(residents) || residents.length === 0) {
      return NextResponse.json(
        { msg: "Invalid payload: expected a non-empty array" },
        { status: 400 }
      );
    }

    // ── Prefetch all SectionStaff records needed ──────────
    // Instead of hitting the DB once per resident, we collect all the unique
    // community+section combos from the payload and fetch them in one query
    const uniquePairs = [
      ...new Map(
        residents.map((r) => [`${r.community}__${r.section}`, { community: r.community, section: r.section }])
      ).values(),
    ];

    const staffRecords = await SectionStaff.find({
      $or: uniquePairs.map(({ community, section }) => ({ community, section })),
    }).lean();

    // build a lookup map: "community__section" -> { raEmail, gaEmail }
    const staffMap = new Map(
      staffRecords.map((s) => [`${s.community}__${s.section}`, { raEmail: s.raEmail, gaEmail: s.gaEmail }])
    );

    // ── Build docs, flagging rows with missing staff ──────
    const missingStaff: { index: number; community: string; section: string }[] = [];

    const docs = residents.map((r, i) => {
      const key = `${r.community}__${r.section}`;
      const staff = staffMap.get(key);

      if (!staff) {
        missingStaff.push({ index: i, community: r.community, section: r.section });
      }

      return {
        ...r,
        fullName: r.fullName || `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim(),
        raEmail: r.raEmail || staff?.raEmail || "",
        gaEmail: r.gaEmail || staff?.gaEmail || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    // if any community+section combo has no staff record, bail early
    // so we don't insert residents with empty raEmail/gaEmail
    if (missingStaff.length > 0) {
      return NextResponse.json(
        {
          msg: "Some rows reference a community/section with no staff record in the database. Add the missing SectionStaff entries first.",
          missingStaff,
        },
        { status: 422 }
      );
    }

    // ── Insert ────────────────────────────────────────────
    // ordered: false keeps going if one doc fails (e.g. duplicate email/studentId)
    // instead of stopping at the first error
    const result = await Resident.insertMany(docs, { ordered: false });

    return NextResponse.json(
      { msg: "Residents imported successfully", inserted: result.length },
      { status: 200 }
    );
  } catch (error: unknown) {
    // insertMany with ordered:false throws a BulkWriteError when some docs fail
    // but still inserts the ones that succeeded — we surface both counts
    if (
      error instanceof Error &&
      "writeErrors" in (error as any) &&
      "insertedDocs" in (error as any)
    ) {
      const bulkError = error as any;
      return NextResponse.json(
        {
          msg: "Partial import — some rows failed",
          inserted: bulkError.insertedDocs?.length ?? 0,
          failed: bulkError.writeErrors?.length ?? 0,
          errors: bulkError.writeErrors?.map((e: any) => ({
            index: e.index,
            message: e.errmsg,
          })),
        },
        { status: 207 }
      );
    }

    return NextResponse.json(
      {
        msg: "Error importing residents",
        error: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    );
  }
}