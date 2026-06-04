import type { Response } from "express";
import { connectDB } from "../../lib/connect.js";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import {
  inviteStaff,
  listStaff,
} from "../../services/admin/staff.service.js";
import {
  applyStaffAssignments,
  deactivateUserAccount,
  reactivateUserAccount,
} from "../../services/admin/assignment.service.js";
import {
  User,
  AuthorizedUser,
  SectionStaff,
  type SectionStaffLean,
} from "../../lib/models.js";
import type { StaffRole } from "../../middleware/auth.js";

const VALID_ROLES: StaffRole[] = ["RA", "GA", "SA", "Admin"];

function validateAssignment(
  role: StaffRole,
  community: string[],
  assignment: string[],
): string | null {
  if (role === "Admin") return null;
  if (!community.length) {
    return "At least one community is required for this role";
  }
  if (role === "RA") {
    if (!assignment.length) {
      return "RA requires a section assignment";
    }
    if (assignment.length > 1) {
      return "RA can only be assigned to one section";
    }
  }
  if ((role === "GA" || role === "SA") && assignment.length > 0) {
    return "Area Directors (AD) and SAs are assigned at the community level only";
  }
  return null;
}

async function assertRaSectionAvailable(
  community: string,
  section: string,
  email: string,
): Promise<SectionStaffLean | null> {
  return SectionStaff.findOne({
    community,
    section,
    raEmail: { $ne: email.trim() },
  }).lean<SectionStaffLean>();
}

export async function listStaffHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();

  const limit = Number(req.query.limit) || 25;
  const role = typeof req.query.role === "string" ? req.query.role : undefined;
  const community =
    typeof req.query.community === "string" ? req.query.community : undefined;
  const q = typeof req.query.q === "string" ? req.query.q : undefined;
  const cursor =
    typeof req.query.cursor === "string" ? req.query.cursor : undefined;

  const result = await listStaff({ limit, role, community, q, cursor });
  res.status(200).json({ msg: "Staff list", ...result });
}

export async function createStaff(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();

  const body = req.body as {
    email?: string;
    role?: StaffRole;
    isActive?: boolean;
    community?: string[];
    assignment?: string[];
    notes?: string;
    gaEmail?: string;
  };

  if (!body.email || !body.role) {
    res.status(400).json({ msg: "Email and role are required" });
    return;
  }

  if (!VALID_ROLES.includes(body.role)) {
    res.status(400).json({ msg: "Invalid role" });
    return;
  }

  const community = body.community ?? [];
  const assignment = body.assignment ?? [];
  const assignmentError = validateAssignment(
    body.role,
    community,
    assignment,
  );
  if (assignmentError) {
    res.status(400).json({ msg: assignmentError });
    return;
  }

  try {
    const result = await inviteStaff({
      email: body.email,
      role: body.role,
      isActive: body.isActive,
      community,
      assignment,
      notes: body.notes,
    });

    const invite = result.record as {
      email: string;
      role: StaffRole;
      community: string[];
      assignment: string[];
    };

    if (body.role === "RA" && community[0] && assignment[0]) {
      const conflict = await assertRaSectionAvailable(
        community[0],
        assignment[0],
        body.email,
      );
      if (conflict) {
        res.status(409).json({
          msg: "This section already has a different RA assigned",
          existingRaEmail: conflict.raEmail,
        });
        return;
      }
    }

    if (body.isActive !== false) {
      await applyStaffAssignments(invite, { gaEmail: body.gaEmail });
    }

    res.status(200).json({
      msg: `${body.role} invite created successfully`,
      staff: result.record,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ACCOUNT_EXISTS") {
        res.status(409).json({ msg: "An account already exists for this email" });
        return;
      }
      if (error.message === "INVITE_EXISTS") {
        res.status(409).json({ msg: "An invite already exists for this email" });
        return;
      }
    }
    res.status(500).json({
      msg: "Error creating staff invite",
      error: error instanceof Error ? error.message : "Unknown",
    });
  }
}

export async function getStaffById(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const { id } = req.params;

  const user = await User.findById(id).lean();
  if (user) {
    const sectionAssignments = await SectionStaff.find({
      $or: [{ raEmail: user.email }, { gaEmail: user.email }],
    }).lean<SectionStaffLean[]>();

    const active = user.isActive !== false;

    res.status(200).json({
      source: "user",
      staff: {
        id: String(user._id),
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: active ? "active" : "inactive",
        isActive: active,
        communities: user.community ?? [],
        assignments: user.assignment ?? [],
        studentId: user.studentId,
        sectionAssignments,
      },
    });
    return;
  }

  const authorized = await AuthorizedUser.findById(id).lean();
  if (authorized) {
    res.status(200).json({
      source: "authorized",
      staff: {
        id: String(authorized._id),
        email: authorized.email,
        fullName: null,
        role: authorized.role,
        status: authorized.isActive ? "pending" : "inactive",
        isActive: authorized.isActive,
        communities: authorized.community ?? [],
        assignments: authorized.assignment ?? [],
        notes: authorized.notes,
      },
    });
    return;
  }

  res.status(404).json({ msg: "Staff member not found" });
}

export async function updateStaff(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const { id } = req.params;
  const body = req.body as {
    isActive?: boolean;
    community?: string[];
    assignment?: string[];
    notes?: string;
    gaEmail?: string;
  };

  const authorized = await AuthorizedUser.findById(id);
  if (authorized) {
    if (body.community) authorized.community = body.community;
    if (body.assignment) authorized.assignment = body.assignment;
    if (body.notes !== undefined) authorized.notes = body.notes;

    if (body.isActive === false) {
      authorized.isActive = false;
    } else if (body.isActive === true) {
      authorized.isActive = true;
    }

    const assignmentError = validateAssignment(
      authorized.role as StaffRole,
      authorized.community ?? [],
      authorized.assignment ?? [],
    );
    if (assignmentError) {
      res.status(400).json({ msg: assignmentError });
      return;
    }

    if (
      authorized.role === "RA" &&
      authorized.isActive &&
      authorized.community?.[0] &&
      authorized.assignment?.[0]
    ) {
      const conflict = await assertRaSectionAvailable(
        authorized.community[0],
        authorized.assignment[0],
        authorized.email,
      );
      if (conflict) {
        res.status(409).json({
          msg: "This section already has a different RA assigned",
          existingRaEmail: conflict.raEmail,
        });
        return;
      }
    }

    await authorized.save();

    if (authorized.isActive) {
      await applyStaffAssignments(authorized, { gaEmail: body.gaEmail });
    }

    res.status(200).json({ msg: "Invite updated", staff: authorized });
    return;
  }

  const user = await User.findById(id);
  if (!user) {
    res.status(404).json({ msg: "Staff member not found" });
    return;
  }

  if (user.role === "Admin" && body.isActive === false) {
    const adminCount = await User.countDocuments({
      role: "Admin",
      isActive: { $ne: false },
    });
    if (adminCount <= 1) {
      res.status(400).json({ msg: "Cannot deactivate the only admin account" });
      return;
    }
  }

  if (body.isActive === false) {
    await deactivateUserAccount(user);
    res.status(200).json({ msg: "Staff deactivated", staff: user });
    return;
  }

  if (body.isActive === true && user.isActive === false) {
    if (body.community) user.community = body.community;
    if (body.assignment) user.assignment = body.assignment;
    const assignmentError = validateAssignment(
      user.role,
      user.community ?? [],
      user.assignment ?? [],
    );
    if (assignmentError) {
      res.status(400).json({ msg: assignmentError });
      return;
    }
    await reactivateUserAccount(user);
    res.status(200).json({ msg: "Staff reactivated", staff: user });
    return;
  }

  if (body.community) user.community = body.community;
  if (body.assignment) user.assignment = body.assignment;

  const assignmentError = validateAssignment(
    user.role,
    user.community ?? [],
    user.assignment ?? [],
  );
  if (assignmentError) {
    res.status(400).json({ msg: assignmentError });
    return;
  }

  if (user.role === "RA" && user.community[0] && user.assignment[0]) {
    const conflict = await assertRaSectionAvailable(
      user.community[0],
      user.assignment[0],
      user.email,
    );
    if (conflict) {
      res.status(409).json({
        msg: "This section already has a different RA assigned",
        existingRaEmail: conflict.raEmail,
      });
      return;
    }
  }

  user.updatedAt = new Date();
  await user.save();

  await applyStaffAssignments(user, {
    userId: String(user._id),
    gaEmail: body.gaEmail,
    isActive: true,
  });

  res.status(200).json({ msg: "Staff updated", staff: user });
}

export async function deleteStaff(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const { id } = req.params;

  const authorized = await AuthorizedUser.findByIdAndDelete(id);
  if (authorized) {
    if (
      authorized.role === "RA" &&
      authorized.community?.[0] &&
      authorized.assignment?.[0]
    ) {
      await SectionStaff.deleteMany({
        community: authorized.community[0],
        section: authorized.assignment[0],
        raEmail: authorized.email,
      });
    }
    res.status(200).json({ msg: "Invite removed" });
    return;
  }

  const user = await User.findById(id);
  if (!user) {
    res.status(404).json({ msg: "Staff member not found" });
    return;
  }

  if (user.role === "Admin") {
    const adminCount = await User.countDocuments({
      role: "Admin",
      isActive: { $ne: false },
    });
    if (adminCount <= 1) {
      res.status(400).json({ msg: "Cannot remove the only admin account" });
      return;
    }
  }

  await deactivateUserAccount(user);
  res.status(200).json({ msg: "Staff deactivated" });
}

export async function addAllowedUser(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  return createStaff(req, res);
}
