import type { Response } from "express";
import { connectDB } from "../../lib/connect.js";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { ResidentChangeRequest } from "../../lib/models.js";
import {
  listResidentChangeRequests,
  approveResidentChangeRequest,
  rejectResidentChangeRequest,
  approveBatchResidentChangeRequests,
  rejectBatchResidentChangeRequests,
} from "../../services/housing/resident-change-requests.service.js";

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
  const requestType =
    typeof req.query.requestType === "string"
      ? req.query.requestType
      : undefined;
  const cursor =
    typeof req.query.cursor === "string" ? req.query.cursor : undefined;

  const result = await listResidentChangeRequests({
    limit,
    status,
    community,
    requestType,
    cursor,
  });

  res.status(200).json({ msg: "Resident change requests", ...result });
}

export async function getRequest(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const request = await ResidentChangeRequest.findById(req.params.id).lean();
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
  await approveResidentChangeRequest(
    req.params.id,
    String(req.dbUser!._id),
  );
  res.status(200).json({ msg: "Request approved" });
}

export async function rejectRequest(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const { reason } = req.body as { reason?: string };
  await rejectResidentChangeRequest(
    req.params.id,
    String(req.dbUser!._id),
    reason,
  );
  res.status(200).json({ msg: "Request rejected" });
}

export async function approveBatch(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const result = await approveBatchResidentChangeRequests(
    req.params.batchId,
    String(req.dbUser!._id),
  );
  res.status(200).json({
    msg: "Batch approval processed",
    ...result,
  });
}

export async function rejectBatch(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const { reason } = req.body as { reason?: string };
  const result = await rejectBatchResidentChangeRequests(
    req.params.batchId,
    String(req.dbUser!._id),
    reason,
  );
  res.status(200).json({
    msg: "Batch rejected",
    ...result,
  });
}
