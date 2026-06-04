import type { Response } from "express";
import { connectDB } from "../../lib/connect.js";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { ResidentAdditionRequest } from "../../lib/models.js";
import {
  listResidentRequests,
  promoteRequestToResident,
  rejectResidentRequest,
} from "../../services/housing/resident-requests.service.js";

export async function listPendingRequests(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
  const status =
    typeof req.query.status === "string" ? req.query.status : "pending";
  const community =
    typeof req.query.community === "string" ? req.query.community : undefined;
  const cursor =
    typeof req.query.cursor === "string" ? req.query.cursor : undefined;

  const result = await listResidentRequests({
    limit,
    status,
    community,
    cursor,
  });

  res.status(200).json({ msg: "Resident requests", ...result });
}

export async function getRequest(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const request = await ResidentAdditionRequest.findById(req.params.id).lean();
  if (!request) {
    res.status(404).json({ msg: "Request not found" });
    return;
  }
  res.status(200).json({ msg: "Request detail", request });
}

export async function approveRequest(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  await promoteRequestToResident(
    req.params.id,
    String(req.dbUser!._id),
  );
  res.status(200).json({ msg: "Resident approved and added" });
}

export async function rejectRequest(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const { reason } = req.body as { reason?: string };
  await rejectResidentRequest(
    req.params.id,
    String(req.dbUser!._id),
    reason,
  );
  res.status(200).json({ msg: "Request rejected" });
}
