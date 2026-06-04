import type { Response } from "express";
import { connectDB } from "../../lib/connect.js";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import {
  Community,
  SectionStaff,
  Resident,
  CommunityStaff,
  User,
  type CommunityLean,
  type SectionStaffLean,
  type CommunityStaffLean,
} from "../../lib/models.js";

export async function getStructure(
  _req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();

  const communities = await Community.find().lean<CommunityLean[]>();

  const structure = await Promise.all(
    communities.map(async (c) => {
      const name = c.community;
      const sections = c.section ?? [];

      const [sectionStaff, gaStaff, saStaff, residentCounts] =
        await Promise.all([
          SectionStaff.find({ community: name }).lean<SectionStaffLean[]>(),
          CommunityStaff.find({ community: name, role: "GA", isActive: true })
            .lean<CommunityStaffLean[]>(),
          CommunityStaff.find({ community: name, role: "SA", isActive: true })
            .lean<CommunityStaffLean[]>(),
          Resident.aggregate<{ _id: string; count: number }>([
            { $match: { community: name } },
            { $group: { _id: "$section", count: { $sum: 1 } } },
          ]),
        ]);

      const countBySection = Object.fromEntries(
        residentCounts.map((r) => [r._id, r.count]),
      );

      const staffByEmail = new Map<string, { fullName: string; role: string }>();
      const emails = new Set<string>();
      for (const s of sectionStaff) {
        emails.add(s.raEmail);
        emails.add(s.gaEmail);
      }
      for (const g of gaStaff) emails.add(g.email);
      for (const s of saStaff) emails.add(s.email);

      if (emails.size > 0) {
        const users = await User.find({
          email: { $in: [...emails] },
        }).lean();
        for (const u of users) {
          staffByEmail.set(u.email, {
            fullName: u.fullName,
            role: u.role,
          });
        }
      }

      const ga = gaStaff.map((g) => ({
        email: g.email,
        role: "GA" as const,
        fullName: staffByEmail.get(g.email)?.fullName ?? null,
      }));

      const sa = saStaff.map((s) => ({
        email: s.email,
        role: "SA" as const,
        fullName: staffByEmail.get(s.email)?.fullName ?? null,
      }));

      const sectionNodes = sections.map((sectionName: string) => {
        const staff = sectionStaff.find((s) => s.section === sectionName);
        const raEmail = staff?.raEmail;
        const gaEmail = staff?.gaEmail;
        return {
          name: sectionName,
          ra: raEmail
            ? {
                email: raEmail,
                fullName: staffByEmail.get(raEmail)?.fullName ?? null,
              }
            : null,
          ga: gaEmail
            ? {
                email: gaEmail,
                fullName: staffByEmail.get(gaEmail)?.fullName ?? null,
              }
            : null,
          residentCount: countBySection[sectionName] ?? 0,
          hasRa: Boolean(raEmail),
        };
      });

      return {
        community: name,
        ga,
        sa,
        sections: sectionNodes,
        gaps: {
          missingGa: ga.length === 0,
          sectionsWithoutRa: sectionNodes
            .filter((s: { hasRa: boolean }) => !s.hasRa)
            .map((s: { name: string }) => s.name),
        },
      };
    }),
  );

  res.status(200).json({ msg: "Organizational structure", communities: structure });
}
