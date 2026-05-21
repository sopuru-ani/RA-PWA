import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/connect";
import SectionStaff from "@/db/sectionStaff.model";

export async function POST(req: NextRequest) {
  await connectDB();

  try {
    const seedData = [
      {
        community: "Student Apartments",
        section: "Student Apartment 1",
        raEmail: "smani@umes.edu",
        gaEmail: "akbonsu@umes.edu",
      },
      {
        community: "Student Apartments",
        section: "Student Apartment 2",
        raEmail: "smani@umes.edu",
        gaEmail: "akbonsu@umes.edu",
      },
      {
        community: "Student Apartments",
        section: "Student Apartment 3",
        raEmail: "smani@umes.edu",
        gaEmail: "akbonsu@umes.edu",
      },
      {
        community: "Student Apartments",
        section: "Student Apartment 4",
        raEmail: "smani@umes.edu",
        gaEmail: "akbonsu@umes.edu",
      },
      {
        community: "Student Apartments",
        section: "Student Apartment 5",
        raEmail: "smani@umes.edu",
        gaEmail: "akbonsu@umes.edu",
      },
      {
        community: "Student Apartments",
        section: "Student Apartment 6",
        raEmail: "smani@umes.edu",
        gaEmail: "akbonsu@umes.edu",
      },
    ];

    // insertMany with ordered:false so it skips dupes if you run it twice
    // upsert alternative below if you'd rather update existing records
    const result = await SectionStaff.insertMany(seedData, { ordered: false });

    return NextResponse.json(
      { msg: "SectionStaff seeded", count: result.length },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        msg: "Error seeding SectionStaff",
        error: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    );
  }
}