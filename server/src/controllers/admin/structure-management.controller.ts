import type { Response } from "express";
import { connectDB } from "../../lib/connect.js";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import * as structure from "../../services/admin/structure-management.service.js";
import { Room, Resident } from "../../lib/models.js";
import { attachVacancyToRooms } from "../../../db/roomVacancy.js";

function communityParam(req: AuthenticatedRequest): string {
  return decodeURIComponent(req.params.community);
}

function sectionParam(req: AuthenticatedRequest): string {
  return decodeURIComponent(req.params.section);
}

export async function createCommunityHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const { community, sections } = req.body as {
    community?: string;
    sections?: string[];
  };
  const result = await structure.createCommunity(
    community ?? "",
    sections ?? [],
  );
  res.status(201).json({ msg: "Community created", community: result });
}

export async function renameCommunityHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const { name } = req.body as { name?: string };
  if (!name) {
    res.status(400).json({ msg: "New community name is required" });
    return;
  }
  const oldName = communityParam(req);
  await structure.renameCommunity(oldName, name);
  res.status(200).json({
    msg: "Community renamed",
    community: { name: name.trim() },
  });
}

export async function deleteCommunityHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  await structure.deleteCommunity(communityParam(req));
  res.status(200).json({ msg: "Community deleted" });
}

export async function addSectionHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const { name } = req.body as { name?: string };
  const sections = await structure.addSection(communityParam(req), name ?? "");
  res.status(201).json({ msg: "Section added", sections });
}

export async function renameSectionHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const { name } = req.body as { name?: string };
  if (!name) {
    res.status(400).json({ msg: "New section name is required" });
    return;
  }
  const sections = await structure.renameSection(
    communityParam(req),
    sectionParam(req),
    name,
  );
  res.status(200).json({ msg: "Section renamed", sections });
}

export async function deleteSectionHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const sections = await structure.removeSection(
    communityParam(req),
    sectionParam(req),
  );
  res.status(200).json({ msg: "Section removed", sections });
}

export async function listRoomsHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const community = communityParam(req);
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
  const section =
    typeof req.query.section === "string" ? req.query.section : undefined;
  const cursor =
    typeof req.query.cursor === "string" ? req.query.cursor : undefined;

  const result = await structure.listRooms({
    community,
    section,
    limit,
    cursor,
  });

  const residents = await Resident.find({ community })
    .select("community section room")
    .lean<{ community: string; section: string; room: string }[]>();
  const items = attachVacancyToRooms(result.items, residents);

  res.status(200).json({
    msg: "Rooms",
    items,
    nextCursor: result.nextCursor,
  });
}

export async function createRoomHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const body = req.body as {
    section?: string;
    room?: string;
    capacity?: number;
    keyCount?: number;
    keyCode?: string;
  };
  const room = await structure.createRoom(communityParam(req), {
    section: body.section ?? "",
    room: body.room ?? "",
    capacity: body.capacity ?? 1,
    keyCount: body.keyCount,
    keyCode: body.keyCode,
  });
  res.status(201).json({ msg: "Room created", room });
}

export async function createRoomsBulkHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const body = req.body as {
    sections?: string[];
    rooms?: string[];
    capacity?: number;
  };
  const result = await structure.createRoomsBulk(communityParam(req), {
    sections: body.sections ?? [],
    rooms: body.rooms ?? [],
    capacity: body.capacity,
  });
  res.status(201).json({ msg: "Bulk room creation finished", ...result });
}

export async function updateRoomHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const body = req.body as {
    section?: string;
    room?: string;
    capacity?: number;
    keyCount?: number;
    keyCode?: string;
  };
  const room = await structure.updateRoom(
    communityParam(req),
    req.params.roomId,
    body,
  );
  res.status(200).json({ msg: "Room updated", room });
}

export async function deleteRoomHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  await structure.deleteRoom(communityParam(req), req.params.roomId);
  res.status(200).json({ msg: "Room deleted" });
}

export async function getSectionSummariesHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const summaries = await structure.getSectionSummaries(communityParam(req));
  res.status(200).json({ msg: "Section summaries", sections: summaries });
}
