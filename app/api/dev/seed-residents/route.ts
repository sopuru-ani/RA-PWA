import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/connect";
import Resident from "@/db/resident.model";
import Room from "@/db/room.model";
import { faker } from "@faker-js/faker" // for generating fake names and emails

export async function POST(req: NextRequest) {
  await connectDB();

  const { community } = await req.json();

  if (!community) {
    return NextResponse.json({ msg: "Missing community name" }, { status: 400 });
  }

  try {
    const rooms = await Room.find({ community });

    if (!rooms.length) {
      return NextResponse.json({ msg: "No rooms found for this community" }, { status: 404 });
    }

    const residentDocs = rooms.map(room => {
      const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const fullName = `${firstName} ${lastName}`;
    const email = faker.internet.email({ firstName, lastName });
    const studentId = faker.number.int({ min: 1000000, max: 9999999 }).toString();

      return {
        fullName,
        firstName,
        lastName,
        email,
        studentId,
        community: room.community,
        section: room.section,
        room: room.room,
        raEmail: "smani@umes.edu",
        gaEmail: "akbonsu@umes.edu",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    const createdResidents = await Resident.insertMany(residentDocs);
    return NextResponse.json({ msg: "Residents seeded", count: createdResidents.length });
  } catch (error: unknown) {
    return NextResponse.json(
      { msg: "Error seeding residents", error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
