import {
  Resident,
  Room,
  Roomcheck,
  type ResidentLean,
  type RoomLean,
  type RoomcheckLean,
} from "../../lib/models.js";
import { attachVacancyToRooms } from "../../../db/roomVacancy.js";

export async function getInspectionSessionData(
  community: string,
  section: string,
) {
  const [resident, room, getSession] = await Promise.all([
    Resident.find({ community, section }).lean<ResidentLean[]>(),
    Room.find({ community, section }).sort({ room: 1 }).lean<RoomLean[]>(),
    Roomcheck.findOne({
      sessionStatus: "in_progress",
      community,
      section,
    }).lean<RoomcheckLean>(),
  ]);

  const roomsChecked = getSession
    ? await Roomcheck.find({
        inspectionSession: getSession.inspectionSession,
        community,
        section,
      }).lean<RoomcheckLean[]>()
    : [];

  return {
    residents: resident,
    rooms: attachVacancyToRooms(room, resident),
    roomsChecked,
    sessionId: getSession?.inspectionSession ?? null,
  };
}

export async function saveRoomCheck(
  community: string,
  section: string,
  inspectorName: string,
  sessionId: string,
  sessionDate: string,
  data: {
    room: string;
    residents: {
      studentId: string;
      name: string;
      email: string;
      isPass: boolean;
      notes?: string;
    }[];
  },
) {
  return Roomcheck.findOneAndUpdate(
    {
      inspectionSession: sessionId,
      room: data.room,
      community,
      section,
    },
    {
      $set: {
        community,
        section,
        room: data.room,
        residents: data.residents,
        inspectionDate: Date.now(),
        inspectionWeek: `Week of ${new Date(sessionDate).toLocaleDateString("en-US")}`,
        inspectedBy: inspectorName,
        inspectionSession: sessionId,
        sessionStatus: "in_progress",
      },
    },
    { returnDocument: "after", upsert: true },
  );
}

export async function getWalkthroughRooms(
  community: string,
  section: string,
  sessionId: string,
) {
  return Roomcheck.find({
    inspectionSession: sessionId,
    community,
    section,
  }).lean<RoomcheckLean[]>();
}

export async function completeInspectionSession(
  community: string,
  section: string,
  sessionId: string,
  sessionDate: string,
) {
  await Roomcheck.updateMany(
    {
      inspectionSession: sessionId,
      community,
      section,
    },
    {
      $set: {
        inspectionWeek: `Week of ${new Date(sessionDate).toLocaleDateString("en-US")}`,
        sessionStatus: "completed",
      },
    },
  );
}

export async function listCompletedWalkthroughsForSection(
  community: string,
  section: string,
) {
  return Roomcheck.aggregate([
    {
      $match: {
        sessionStatus: "completed",
        community,
        section,
      },
    },
    {
      $group: {
        _id: "$inspectionSession",
        inspectionSession: { $first: "$inspectionSession" },
        title: { $first: "$inspectionWeek" },
        inspectionDate: { $first: "$inspectionDate" },
        section: { $first: "$section" },
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
        section: 1,
        totalRooms: 1,
        completedRooms: 1,
      },
    },
    { $sort: { inspectionDate: -1 } },
  ]);
}

export async function listCompletedWalkthroughsForCommunity(community: string) {
  return Roomcheck.aggregate([
    {
      $match: {
        sessionStatus: "completed",
        community,
      },
    },
    {
      $group: {
        _id: { session: "$inspectionSession", section: "$section" },
        inspectionSession: { $first: "$inspectionSession" },
        title: { $first: "$inspectionWeek" },
        inspectionDate: { $first: "$inspectionDate" },
        section: { $first: "$section" },
        inspectedBy: { $first: "$inspectedBy" },
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
        section: 1,
        inspectedBy: 1,
        totalRooms: 1,
        completedRooms: 1,
      },
    },
    { $sort: { inspectionDate: -1 } },
  ]);
}

export async function listInProgressSessions(community: string) {
  const sessions = await Roomcheck.aggregate([
    {
      $match: {
        sessionStatus: "in_progress",
        community,
      },
    },
    {
      $group: {
        _id: { section: "$section", session: "$inspectionSession" },
        section: { $first: "$section" },
        inspectionSession: { $first: "$inspectionSession" },
        inspectionWeek: { $first: "$inspectionWeek" },
        roomCount: { $sum: 1 },
      },
    },
    { $sort: { section: 1 } },
  ]);
  return sessions;
}
