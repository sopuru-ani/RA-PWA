import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/connect";
import Room from "@/db/room.model";

export async function POST(req: NextRequest) {
  await connectDB();

  const { community, sections, rooms, capacity } = await req.json();

  if (!community || !sections?.length || !rooms?.length) {
    return NextResponse.json(
      { msg: "Missing required data: community, sections, rooms" },
      { status: 400 }
    );
  }

  // Build array of room documents for all sections
  const roomDocs = sections.flatMap((section: string) =>
    rooms.map((roomNumber: string) => ({
      community,
      section,
      room: roomNumber,
      capacity: capacity || 1, // default 2 if not provided
      vacancy: 0,
      createdAt: new Date(),
    }))
  );

  try {
    const createdRooms = await Room.insertMany(roomDocs);
    return NextResponse.json({ msg: "Rooms created", data: createdRooms });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        msg: "Error creating rooms",
        error: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    );
  }
}
