import type { Request, Response } from "express";
import { faker } from "@faker-js/faker";
import { connectDB } from "../lib/connect.js";
import { Resident, Room, Community, SectionStaff } from "../lib/models.js";

export async function seedResidents(
  req: Request,
  res: Response,
): Promise<void> {
  await connectDB();
  const { community } = req.body;

  if (!community) {
    res.status(400).json({ msg: "Missing community name" });
    return;
  }

  try {
    const rooms = await Room.find({ community });

    if (!rooms.length) {
      res.status(404).json({ msg: "No rooms found for this community" });
      return;
    }

    const residentDocs = rooms.map((room) => {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const fullName = `${firstName} ${lastName}`;
      const email = faker.internet.email({ firstName, lastName });
      const studentId = faker.number
        .int({ min: 1000000, max: 9999999 })
        .toString();

      return {
        fullName,
        firstName,
        lastName,
        email,
        studentId,
        community: room.community,
        section: room.section,
        room: room.room,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    const createdResidents = await Resident.insertMany(residentDocs);
    res.json({ msg: "Residents seeded", count: createdResidents.length });
  } catch (error: unknown) {
    res.status(500).json({
      msg: "Error seeding residents",
      error: error instanceof Error ? error.message : "Unknown",
    });
  }
}

export async function seedRooms(req: Request, res: Response): Promise<void> {
  await connectDB();

  const { community, sections, rooms, capacity } = req.body;

  if (!community || !sections?.length || !rooms?.length) {
    res.status(400).json({
      msg: "Missing required data: community, sections, rooms",
    });
    return;
  }

  const roomDocs = sections.flatMap((section: string) =>
    rooms.map((roomNumber: string) => ({
      community,
      section,
      room: roomNumber,
      capacity: capacity || 1,
      createdAt: new Date(),
    })),
  );

  try {
    const createdRooms = await Room.insertMany(roomDocs);
    res.json({ msg: "Rooms created", data: createdRooms });
  } catch (error: unknown) {
    res.status(500).json({
      msg: "Error creating rooms",
      error: error instanceof Error ? error.message : "Unknown",
    });
  }
}

export async function seedHousing(req: Request, res: Response): Promise<void> {
  await connectDB();
  const { community, section } = req.body;

  if (!community) {
    res.status(400).json({ msg: "Please specify a community" });
    return;
  }

  const newCommunity = await Community.create({
    community,
    section,
  } as Parameters<typeof Community.create>[0]);
  res
    .status(200)
    .json({ msg: "successful creation", data: newCommunity });
}

export async function seedSectionRoute(
  _req: Request,
  res: Response,
): Promise<void> {
  await connectDB();

  try {
    const seedData = [
      {
        community: "Student Apartments",
        section: "Student Apartment 1",
        raEmail: "smani@umes.edu",
        gaEmail: "qrmanager.app@gmail.com",
      },
      {
        community: "Student Apartments",
        section: "Student Apartment 2",
        raEmail: "smani@umes.edu",
        gaEmail: "qrmanager.app@gmail.com",
      },
      {
        community: "Student Apartments",
        section: "Student Apartment 3",
        raEmail: "smani@umes.edu",
        gaEmail: "qrmanager.app@gmail.com",
      },
      {
        community: "Student Apartments",
        section: "Student Apartment 4",
        raEmail: "smani@umes.edu",
        gaEmail: "qrmanager.app@gmail.com",
      },
      {
        community: "Student Apartments",
        section: "Student Apartment 5",
        raEmail: "smani@umes.edu",
        gaEmail: "qrmanager.app@gmail.com",
      },
      {
        community: "Student Apartments",
        section: "Student Apartment 6",
        raEmail: "smani@umes.edu",
        gaEmail: "qrmanager.app@gmail.com",
      },
    ];

    const result = await SectionStaff.insertMany(seedData, {
      ordered: false,
    });

    res.status(200).json({ msg: "SectionStaff seeded", count: result.length });
  } catch (error: unknown) {
    res.status(500).json({
      msg: "Error seeding SectionStaff",
      error: error instanceof Error ? error.message : "Unknown",
    });
  }
}
