import type { IAuthorized } from "../../../db/authorizedAccounts.model.js";
import type { IUser } from "../../../db/user.model.js";
import {
  User,
  AuthorizedUser,
  SectionStaff,
  CommunityStaff,
} from "../../lib/models.js";

export type StaffRole = IUser["role"] | IAuthorized["role"];

export type StaffListItem = {
  id: string;
  source: "user" | "authorized";
  email: string;
  fullName: string | null;
  role: StaffRole;
  status: "active" | "inactive" | "pending";
  communities: string[];
  assignments: string[];
  hasAccount: boolean;
  isActive: boolean;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function listStaff(options: {
  limit: number;
  role?: string;
  community?: string;
  q?: string;
  cursor?: string;
}): Promise<{ items: StaffListItem[]; nextCursor: string | null }> {
  const limit = Math.min(Math.max(options.limit, 1), 100);
  const q = options.q?.trim().toLowerCase();

  const [users, authorized, userEmails] = await Promise.all([
    User.find().lean(),
    AuthorizedUser.find().lean(),
    User.find().distinct("email"),
  ]);

  const userEmailSet = new Set(userEmails.map((e) => normalizeEmail(e)));

  const items: StaffListItem[] = [];

  for (const u of users) {
    const role = u.role as StaffRole;
    if (options.role && role !== options.role) continue;
    if (
      options.community &&
      !(u.community ?? []).includes(options.community)
    ) {
      continue;
    }
    const email = normalizeEmail(u.email);
    if (
      q &&
      !email.includes(q) &&
      !`${u.firstName} ${u.lastName}`.toLowerCase().includes(q)
    ) {
      continue;
    }

    const active = u.isActive !== false;
    items.push({
      id: String(u._id),
      source: "user",
      email: u.email,
      fullName: u.fullName,
      role,
      status: active ? "active" : "inactive",
      communities: u.community ?? [],
      assignments: u.assignment ?? [],
      hasAccount: true,
      isActive: active,
    });
  }

  for (const a of authorized) {
    const email = normalizeEmail(a.email);
    if (userEmailSet.has(email)) continue;

    if (options.role && a.role !== options.role) continue;
    if (
      options.community &&
      !(a.community ?? []).includes(options.community)
    ) {
      continue;
    }
    if (q && !email.includes(q)) continue;

    items.push({
      id: String(a._id),
      source: "authorized",
      email: a.email,
      fullName: null,
      role: a.role as StaffRole,
      status: a.isActive ? "pending" : "inactive",
      communities: a.community ?? [],
      assignments: a.assignment ?? [],
      hasAccount: false,
      isActive: a.isActive,
    });
  }

  items.sort((a, b) => a.email.localeCompare(b.email));

  let startIndex = 0;
  if (options.cursor) {
    const idx = items.findIndex((i) => i.id === options.cursor);
    startIndex = idx >= 0 ? idx + 1 : 0;
  }

  const page = items.slice(startIndex, startIndex + limit);
  const nextCursor =
    startIndex + limit < items.length
      ? (page[page.length - 1]?.id ?? null)
      : null;

  return { items: page, nextCursor };
}

export async function inviteStaff(body: {
  email: string;
  role: StaffRole;
  isActive?: boolean;
  community?: string[];
  assignment?: string[];
  notes?: string;
}): Promise<{ kind: "authorized" | "user"; record: unknown }> {
  const email = normalizeEmail(body.email);
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("ACCOUNT_EXISTS");
  }

  const existingAllowed = await AuthorizedUser.findOne({ email });
  if (existingAllowed) {
    throw new Error("INVITE_EXISTS");
  }

  const allowed = await AuthorizedUser.create({
    email: body.email.trim(),
    role: body.role,
    isActive: body.isActive ?? true,
    community: body.community ?? [],
    assignment: body.assignment ?? [],
    notes: body.notes,
  });

  return { kind: "authorized", record: allowed };
}

export async function syncSectionStaffForRa(
  community: string,
  section: string,
  raEmail: string,
  gaEmail?: string,
): Promise<void> {
  const update: Record<string, string> = {
    raEmail: raEmail.trim(),
  };
  if (gaEmail) {
    update.gaEmail = gaEmail.trim();
  }

  await SectionStaff.findOneAndUpdate(
    { community, section },
    { $set: { community, section, ...update } },
    { upsert: true, new: true },
  );
}

export async function syncCommunityStaff(
  community: string,
  userId: string,
  role: "GA" | "SA",
  email: string,
  isActive = true,
): Promise<void> {
  await CommunityStaff.findOneAndUpdate(
    { community, userId, role },
    {
      $set: {
        community,
        userId,
        role,
        email: email.trim(),
        isActive,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true, new: true },
  );
}
