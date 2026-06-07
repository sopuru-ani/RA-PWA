/**
 * Read-only audit: compare SectionStaff / CommunityStaff vs User accounts.
 * Run from server/: npx tsx scripts/audit-staff-resolution.ts
 */
import mongoose from "mongoose";
import { env } from "../src/config/env.js";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

type LeanUser = {
  _id: unknown;
  email: string;
  fullName?: string;
  role: string;
  community?: string[];
  isActive?: boolean;
};

async function main(): Promise<void> {
  await mongoose.connect(env.mongodbUri);
  const db = mongoose.connection.db;
  if (!db) throw new Error("No database connection");

  const communitiesCol = db.collection("communities");
  const sectionStaffCol = db.collection("sectionstaffs");
  const communityStaffCol = db.collection("communitystaffs");
  const usersCol = db.collection("users");

  const communities = await communitiesCol
    .find({}, { projection: { community: 1, section: 1 } })
    .toArray();

  const allUsers = (await usersCol
    .find(
      { role: { $in: ["RA", "GA", "SA", "Admin"] } },
      { projection: { email: 1, fullName: 1, role: 1, community: 1, isActive: 1 } },
    )
    .toArray()) as LeanUser[];

  const usersByEmail = new Map<string, LeanUser>();
  for (const u of allUsers) {
    usersByEmail.set(normalizeEmail(u.email), u);
  }

  console.log("\n=== Department-wide active staff (User collection) ===\n");
  for (const role of ["RA", "GA", "SA", "Admin"] as const) {
    const active = allUsers.filter((u) => u.role === role && u.isActive !== false);
    const inactive = allUsers.filter((u) => u.role === role && u.isActive === false);
    console.log(
      `${role}: ${active.length} active, ${inactive.length} inactive (${allUsers.filter((u) => u.role === role).length} total)`,
    );
  }

  console.log("\n=== Communities ===\n");
  if (communities.length === 0) {
    console.log("(no communities in DB)");
  }

  for (const doc of communities) {
    const name = doc.community as string;
    const sections = (doc.section as string[] | undefined) ?? [];
    console.log(`\n--- ${name} (${sections.length} sections in Community doc) ---`);

    const sectionStaff = await sectionStaffCol.find({ community: name }).toArray();
    const raEmails = [
      ...new Set(
        sectionStaff
          .map((s) => (s.raEmail as string | undefined)?.trim())
          .filter(Boolean) as string[],
      ),
    ];
    const gaEmailsFromSections = [
      ...new Set(
        sectionStaff
          .map((s) => (s.gaEmail as string | undefined)?.trim())
          .filter(Boolean) as string[],
      ),
    ];

    console.log(`SectionStaff rows: ${sectionStaff.length}`);
    console.log(`Unique RA emails (SectionStaff): ${raEmails.length}`);

    let raMatchedActive = 0;
    let raMatchedInactive = 0;
    let raNoAccount = 0;
    const raMissing: string[] = [];

    for (const email of raEmails) {
      const user = usersByEmail.get(normalizeEmail(email));
      if (!user) {
        raNoAccount++;
        raMissing.push(email);
      } else if (user.isActive === false) {
        raMatchedInactive++;
      } else if (user.role === "RA") {
        raMatchedActive++;
      } else {
        raMatchedInactive++;
        raMissing.push(`${email} (User role=${user.role})`);
      }
    }

    console.log(
      `  RA email → User: ${raMatchedActive} active RA accounts, ${raMatchedInactive} inactive/wrong-role, ${raNoAccount} no User account`,
    );
    if (raMissing.length > 0 && raMissing.length <= 10) {
      console.log(`  Unresolved RA emails: ${raMissing.join(", ")}`);
    } else if (raMissing.length > 10) {
      console.log(
        `  Unresolved RA emails (first 10): ${raMissing.slice(0, 10).join(", ")} … +${raMissing.length - 10} more`,
      );
    }

    const communityStaff = await communityStaffCol
      .find({ community: name, isActive: { $ne: false } })
      .toArray();

    const csGa = communityStaff.filter((c) => c.role === "GA");
    const csSa = communityStaff.filter((c) => c.role === "SA");
    console.log(`CommunityStaff: ${csGa.length} GA, ${csSa.length} SA (active)`);

    for (const label of ["GA", "SA"] as const) {
      const rows = communityStaff.filter((c) => c.role === label);
      let byId = 0;
      let byEmail = 0;
      let unresolved = 0;
      for (const row of rows) {
        const uid = row.userId ? String(row.userId) : "";
        const byUserId = uid
          ? allUsers.find((u) => String(u._id) === uid && u.isActive !== false)
          : undefined;
        if (byUserId) {
          byId++;
          continue;
        }
        const em = (row.email as string | undefined)?.trim();
        const byEm = em ? usersByEmail.get(normalizeEmail(em)) : undefined;
        if (byEm && byEm.isActive !== false) {
          byEmail++;
        } else {
          unresolved++;
        }
      }
      console.log(
        `  ${label} CommunityStaff → User: ${byId} by userId, ${byEmail} by email only, ${unresolved} unresolved`,
      );
    }

    if (gaEmailsFromSections.length > 0) {
      console.log(`Section GA emails: ${gaEmailsFromSections.join(", ")}`);
    }

    const usersWithCommunity = allUsers.filter(
      (u) =>
        u.isActive !== false &&
        (u.community ?? []).includes(name),
    );
    const byRole = { RA: 0, GA: 0, SA: 0, Admin: 0 };
    for (const u of usersWithCommunity) {
      if (u.role in byRole) byRole[u.role as keyof typeof byRole]++;
    }
    console.log(
      `User.community includes "${name}": RA=${byRole.RA}, GA=${byRole.GA}, SA=${byRole.SA}, Admin=${byRole.Admin}`,
    );
  }

  console.log("\n=== Sample: User.community vs Community names ===\n");
  const communityNames = new Set(
    communities.map((c) => c.community as string),
  );
  const orphanCommunityValues = new Map<string, number>();
  for (const u of allUsers) {
    for (const c of u.community ?? []) {
      if (!communityNames.has(c)) {
        orphanCommunityValues.set(c, (orphanCommunityValues.get(c) ?? 0) + 1);
      }
    }
  }
  if (orphanCommunityValues.size === 0) {
    console.log("All User.community values match a Community.community name.");
  } else {
    console.log("User.community values NOT in Community collection:");
    for (const [c, n] of orphanCommunityValues) {
      console.log(`  "${c}": ${n} user(s)`);
    }
  }

  console.log("\n=== Done ===\n");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
