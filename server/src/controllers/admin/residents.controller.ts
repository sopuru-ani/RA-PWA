import type { Response } from "express";

import { connectDB } from "../../lib/connect.js";

import type { AuthenticatedRequest } from "../../middleware/auth.js";

import {
  listResidents as listResidentsQuery,
  getResidentById,
  updateResidentAdmin,
  deleteResidentAdmin,
  moveResidentAdmin,
} from "../../services/housing/residents.service.js";
import type { ResidentUpdateRequestPayload } from "../../../db/residentChangeRequest.model.js";

export async function listResidents(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();

  const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
  const community =
    typeof req.query.community === "string" ? req.query.community : undefined;
  const section =
    typeof req.query.section === "string" ? req.query.section : undefined;
  const q = typeof req.query.q === "string" ? req.query.q.trim() : undefined;
  const cursor =
    typeof req.query.cursor === "string" ? req.query.cursor : undefined;

  const result = await listResidentsQuery({
    limit,
    community,
    section,
    q,
    cursor,
  });

  res.status(200).json({
    msg: "Residents",
    items: result.items,
    nextCursor: result.nextCursor,
  });
}

export async function getResident(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const resident = await getResidentById(req.params.id);

  if (!resident) {
    res.status(404).json({ msg: "Resident not found" });
    return;
  }

  res.status(200).json({ msg: "Resident detail", resident });
}

export async function updateResident(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const resident = await updateResidentAdmin(
    req.params.id,
    req.body as ResidentUpdateRequestPayload & Record<string, unknown>,
  );
  res.status(200).json({ msg: "Resident updated", resident });
}

export async function deleteResident(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  await deleteResidentAdmin(req.params.id);
  res.status(200).json({ msg: "Resident removed" });
}

export async function moveResident(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const body = req.body as {
    community?: string;
    section?: string;
    room?: string;
  };
  const resident = await moveResidentAdmin(req.params.id, {
    community: body.community ?? "",
    section: body.section ?? "",
    room: body.room ?? "",
  });
  res.status(200).json({ msg: "Resident moved", resident });
}
