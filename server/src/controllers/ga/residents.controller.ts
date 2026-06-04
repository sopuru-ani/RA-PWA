import type { Response } from "express";
import { connectDB } from "../../lib/connect.js";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { requirePrimaryCommunity } from "../../lib/community-scope.js";
import {
  listResidents,
  getResidentById,
} from "../../services/housing/residents.service.js";
import type { ResidentRequestPayload } from "../../../db/residentAdditionRequest.model.js";
import {
  createResidentRequest,
  createBulkResidentRequests,
  listResidentRequests,
} from "../../services/housing/resident-requests.service.js";

export async function listResidentsHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const community = requirePrimaryCommunity(req.dbUser!);
  const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
  const section =
    typeof req.query.section === "string" ? req.query.section : undefined;
  const q = typeof req.query.q === "string" ? req.query.q.trim() : undefined;
  const cursor =
    typeof req.query.cursor === "string" ? req.query.cursor : undefined;

  const result = await listResidents({
    limit,
    community,
    section,
    q,
    cursor,
  });

  res.status(200).json({ msg: "Residents", ...result });
}

export async function getResident(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const community = requirePrimaryCommunity(req.dbUser!);
  const resident = await getResidentById(req.params.id);

  if (!resident || resident.community !== community) {
    res.status(404).json({ msg: "Resident not found" });
    return;
  }

  res.status(200).json({ msg: "Resident detail", resident });
}

export async function submitResidentRequest(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const community = requirePrimaryCommunity(req.dbUser!);
  const body = req.body as ResidentRequestPayload;
  const result = await createResidentRequest(req.dbUser!, {
    ...body,
    community,
  });
  res.status(201).json({
    msg: "Resident request submitted for admin approval",
    ...result,
  });
}

export async function submitBulkResidentRequests(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const community = requirePrimaryCommunity(req.dbUser!);
  const rows = req.body as ResidentRequestPayload[];
  const result = await createBulkResidentRequests(
    req.dbUser!,
    rows,
    community,
  );
  res.status(201).json({
    msg: "Bulk resident requests submitted",
    ...result,
  });
}

export async function listMyRequests(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
  const status =
    typeof req.query.status === "string" ? req.query.status : undefined;
  const cursor =
    typeof req.query.cursor === "string" ? req.query.cursor : undefined;

  const result = await listResidentRequests({
    limit,
    status,
    submittedBy: String(req.dbUser!._id),
    cursor,
  });

  res.status(200).json({ msg: "My resident requests", ...result });
}
