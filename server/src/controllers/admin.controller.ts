import type { Response } from "express";
import { connectDB } from "../lib/connect.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { Resident, SectionStaff } from "../lib/models.js";
import { buildStaffMap, omitStaffFields, staffKey } from "../../db/residentStaff.js";

export async function seedResidents(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();

  try {
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
    }).lean<{
      community: string;
      section: string;
      raEmail: string;
      gaEmail: string;
    }[]>();

    const staffMap = buildStaffMap(staffRecords);

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
          [key: string]: unknown;
        },
        i: number,
      ) => {
        const key = staffKey(r.community, r.section);

        if (!staffMap.has(key)) {
          missingStaff.push({
            index: i,
            community: r.community,
            section: r.section,
          });
        }

        const base = omitStaffFields(r);

        return {
          ...base,
          fullName:
            r.fullName ||
            `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim(),
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
