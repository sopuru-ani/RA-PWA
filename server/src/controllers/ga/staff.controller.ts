import type { Response } from "express";
import { connectDB } from "../../lib/connect.js";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { requirePrimaryCommunity } from "../../lib/community-scope.js";
import { listStaff } from "../../services/admin/staff.service.js";
import { User } from "../../lib/models.js";

export async function listStaffHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const community = requirePrimaryCommunity(req.dbUser!);
  const limit = Number(req.query.limit) || 25;
  const role = typeof req.query.role === "string" ? req.query.role : undefined;
  const q = typeof req.query.q === "string" ? req.query.q : undefined;
  const cursor =
    typeof req.query.cursor === "string" ? req.query.cursor : undefined;

  const result = await listStaff({
    limit,
    role,
    community,
    q,
    cursor,
  });

  const filtered = {
    ...result,
    items: result.items.filter(
      (s) => s.role === "RA" || s.role === "SA" || s.role === "GA",
    ),
  };

  res.status(200).json({ msg: "Staff list", ...filtered });
}

export async function getStaffById(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const community = requirePrimaryCommunity(req.dbUser!);

  const user = await User.findById(req.params.id).lean();
  if (!user || !(user.community ?? []).includes(community)) {
    res.status(404).json({ msg: "Staff member not found" });
    return;
  }

  if (user.role !== "RA" && user.role !== "SA" && user.role !== "GA") {
    res.status(404).json({ msg: "Staff member not found" });
    return;
  }

  res.status(200).json({
    msg: "Staff detail",
    staff: {
      id: String(user._id),
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      communities: user.community ?? [],
      assignments: user.assignment ?? [],
      isActive: user.isActive !== false,
    },
  });
}
