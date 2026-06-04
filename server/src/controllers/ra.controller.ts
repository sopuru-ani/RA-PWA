import type { Response } from "express";
import { connectDB } from "../lib/connect.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import {
  Resident,
  Room,
  Community,
  Incident,
  Roomcheck,
  type ResidentLean,
  type RoomLean,
  type CommunityLean,
  type IncidentLean,
  type RoomcheckLean,
} from "../lib/models.js";
import { attachVacancyToRooms } from "../../db/roomVacancy.js";

export async function getDashboard(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();

  try {
    const dbUser = req.dbUser!;

    const sendUser = {
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      assignment: dbUser.assignment,
      community: dbUser.community,
      role: dbUser.role,
    };

    const resident = await Resident.find({
      community: dbUser.community[0],
    }).lean<ResidentLean[]>();
    const room = await Room.find({
      community: dbUser.community[0],
    }).lean<RoomLean[]>();
    const community = await Community.find({
      community: dbUser.community[0],
    }).lean<CommunityLean[]>();
    const incidents = await Incident.find({
      community: dbUser.community[0],
    }).lean<IncidentLean[]>();
    const roomsChecked = await Roomcheck.findOne({
      sessionStatus: "in_progress",
      community: dbUser.community[0],
      section: dbUser.assignment[0],
    }).lean<RoomcheckLean>();

    const walkthroughs = await Roomcheck.aggregate([
      {
        $match: {
          sessionStatus: "completed",
          community: dbUser.community[0],
          section: dbUser.assignment[0],
        },
      },
      {
        $group: {
          _id: "$inspectionSession",
          inspectionSession: { $first: "$inspectionSession" },
          title: { $first: "$inspectionWeek" },
          inspectionDate: { $first: "$inspectionDate" },
          totalRooms: { $sum: 1 },
          completedRooms: {
            $sum: {
              $cond: [{ $eq: ["$sessionStatus", "completed"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          inspectionSession: 1,
          title: 1,
          inspectionDate: 1,
          totalRooms: 1,
          completedRooms: 1,
        },
      },
      { $sort: { inspectionDate: -1 } },
    ]);

    res.status(200).json({
      msg: "Residents fetched successfully!",
      residents: resident,
      rooms: attachVacancyToRooms(room, resident),
      user: sendUser,
      communityInfo: community,
      incidents,
      roomsChecked,
      walkthroughs,
    });
  } catch (error) {
    res.status(500).json({
      msg: "Internal Server Error",
      error: error instanceof Error ? error.message : "Unknown Error",
    });
  }
}

export async function getInspectionSession(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();

  try {
    const dbUser = req.dbUser!;

    const sendUser = {
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      assignment: dbUser.assignment,
      community: dbUser.community,
      role: dbUser.role,
    };

    const resident = await Resident.find({
      community: dbUser.community[0],
      section: dbUser.assignment[0],
    }).lean<ResidentLean[]>();
    const room = await Room.find({
      community: dbUser.community[0],
      section: dbUser.assignment[0],
    })
      .sort({ room: 1 })
      .lean<RoomLean[]>();
    const getSession = await Roomcheck.findOne({
      sessionStatus: "in_progress",
      community: dbUser.community[0],
      section: dbUser.assignment[0],
    }).lean<RoomcheckLean>();
    const roomsChecked = await Roomcheck.find({
      inspectionSession: getSession?.inspectionSession,
      community: dbUser.community[0],
      section: dbUser.assignment[0],
    }).lean<RoomcheckLean[]>();

    res.status(200).json({
      msg: "Residents fetched successfully!",
      residents: resident,
      rooms: attachVacancyToRooms(room, resident),
      roomsChecked,
      user: sendUser,
    });
  } catch (error) {
    res.status(500).json({
      msg: "Internal Server Error",
      error: error instanceof Error ? error.message : "Unknown Error",
    });
  }
}

export async function roomCheck(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();

  try {
    const dbUser = req.dbUser!;
    const { data, sessionId, sessionDate } = req.body;

    const newRoomcheck = await Roomcheck.findOneAndUpdate(
      {
        inspectionSession: sessionId,
        room: data.room,
        community: dbUser.community[0],
        section: dbUser.assignment[0],
      },
      {
        $set: {
          community: dbUser.community[0],
          section: dbUser.assignment[0],
          room: data.room,
          residents: data.residents,
          inspectionDate: Date.now(),
          inspectionWeek: `Week of ${new Date(sessionDate).toLocaleDateString("en-US")}`,
          inspectedBy: `${dbUser.firstName} ${dbUser.lastName}`,
          inspectionSession: sessionId,
          sessionStatus: "in_progress",
        },
      },
      { returnDocument: "after", upsert: true },
    );

    res.status(200).json({
      msg: (newRoomcheck as unknown as { inspectionDate: Date })
        .inspectionDate,
    });
  } catch (error) {
    res.status(500).json({
      msg: "Internal Server Error",
      error: error instanceof Error ? error.message : "Unknown Error",
    });
  }
}

export async function walkthrough(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();

  try {
    const dbUser = req.dbUser!;
    const { sessionId } = req.body;

    const roomsChecked = await Roomcheck.find({
      inspectionSession: sessionId,
      community: dbUser.community[0],
      section: dbUser.assignment[0],
    }).lean<RoomcheckLean[]>();

    res.status(200).json({
      msg: "Residents fetched successfully!",
      roomsChecked,
    });
  } catch (error) {
    res.status(500).json({
      msg: "Internal Server Error",
      error: error instanceof Error ? error.message : "Unknown Error",
    });
  }
}

export async function allChecked(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();

  try {
    const dbUser = req.dbUser!;
    const { sessionId, sessionDate } = req.body;

    await Roomcheck.updateMany(
      {
        inspectionSession: sessionId,
        community: dbUser.community[0],
        section: dbUser.assignment[0],
      },
      {
        $set: {
          inspectionWeek: `Week of ${new Date(sessionDate).toLocaleDateString("en-US")}`,
          sessionStatus: "completed",
        },
      },
    );

    res.status(200).json({ msg: "Successful" });
  } catch (error) {
    res.status(500).json({
      msg: "Internal Server Error",
      error: error instanceof Error ? error.message : "Unknown Error",
    });
  }
}
