/**
 * Compare DB staff records vs program picker resolution (read-only + simulation).
 * Run: cd server && npx tsx scripts/audit-staff-vs-picker.ts
 */
import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import { resolveStaffUsers } from "../src/services/programs/community-staff-resolver.service.js";
import { listAudienceCandidates } from "../src/services/programs/audience-candidates.service.js";
import {
  User,
  AuthorizedUser,
  SectionStaff,
  CommunityStaff,
} from "../src/lib/models.js";

const COMMUNITIES = ["Student Apartments", "Student Residential Complex"];

async function main(): Promise<void> {
  await mongoose.connect(env.mongodbUri);
  const db = mongoose.connection.db!;

  console.log("\n========== USERS (staff roles) ==========\n");
  const users = await User.find({
    role: { $in: ["RA", "GA", "SA", "Admin"] },
  })
    .sort({ role: 1, fullName: 1 })
    .lean();
  for (const u of users) {
    console.log(
      JSON.stringify({
        id: String(u._id),
        role: u.role,
        fullName: u.fullName,
        email: u.email,
        isActive: u.isActive,
        community: u.community,
        assignment: u.assignment,
      }),
    );
  }

  console.log("\n========== AUTHORIZED (pending invites) ==========\n");
  const invites = await AuthorizedUser.find({
    role: { $in: ["RA", "GA", "SA", "Admin"] },
  }).lean();
  if (invites.length === 0) console.log("(none)");
  for (const a of invites) {
    console.log(
      JSON.stringify({
        role: a.role,
        email: a.email,
        isActive: a.isActive,
        community: a.community,
        assignment: a.assignment,
      }),
    );
  }

  console.log("\n========== SECTION STAFF ==========\n");
  for (const c of COMMUNITIES) {
    const rows = await SectionStaff.find({ community: c }).lean();
    console.log(`\n${c} (${rows.length} rows):`);
    const raEmails = new Set(rows.map((r) => r.raEmail?.trim()).filter(Boolean));
    const gaEmails = new Set(rows.map((r) => r.gaEmail?.trim()).filter(Boolean));
    console.log(`  unique raEmail: ${[...raEmails].join(", ") || "(none)"}`);
    console.log(`  unique gaEmail: ${[...gaEmails].join(", ") || "(none)"}`);
  }

  console.log("\n========== COMMUNITY STAFF ==========\n");
  for (const c of COMMUNITIES) {
    const rows = await CommunityStaff.find({ community: c }).lean();
    console.log(`\n${c} (${rows.length} rows):`);
    for (const r of rows) {
      console.log(
        JSON.stringify({
          role: r.role,
          email: r.email,
          userId: String(r.userId),
          isActive: r.isActive,
        }),
      );
    }
    if (rows.length === 0) console.log("  (none)");
  }

  console.log("\n========== PICKER SIMULATION: resolveStaffUsers ==========\n");

  for (const label of [
    "dept-wide (communities=[])",
    ...COMMUNITIES.map((c) => `community="${c}"`),
  ]) {
    const communities =
      label.startsWith("dept") ? [] : [label.match(/"(.+)"/)![1]];
    const resolved = await resolveStaffUsers({ communities, roles: ["RA", "GA", "SA", "Admin"] });
    console.log(`\n${label} → ${resolved.length} candidates:`);
    for (const r of resolved) {
      console.log(`  ${r.fullName} · ${r.role} · ${r.email} · communities=${JSON.stringify(r.communities)}`);
    }
  }

  console.log("\n========== PICKER SIMULATION: listAudienceCandidates ==========\n");

  const admin = await User.findOne({ role: "Admin", isActive: { $ne: false } });
  const ga = await User.findOne({ role: "GA", email: /qrmanager/i });
  const srcGa = await User.findOne({ email: "src-ga@umes.edu" });

  if (admin) {
    const hydratedAdmin = await User.findById(admin._id);
    if (hydratedAdmin) {
      for (const mode of [
        { community: undefined, label: "admin, no community param (dept-wide)" },
        { community: "Student Residential Complex", label: "admin, SRC" },
      ] as const) {
        const list = await listAudienceCandidates(hydratedAdmin, {
          community: mode.community,
        });
        console.log(`\n${mode.label} → ${list.length}:`);
        for (const c of list) {
          console.log(`  ${c.fullName} · ${c.role} · ${c.email}`);
        }
      }
    }
  }

  const gaUser = ga ?? srcGa;
  if (gaUser) {
    const hydratedGa = await User.findById(gaUser._id);
    if (hydratedGa) {
      const list = await listAudienceCandidates(hydratedGa, {
        community: "Student Residential Complex",
      });
      console.log(
        `\nGA ${gaUser.fullName} (${gaUser.email}), community param=SRC → ${list.length}:`,
      );
      for (const c of list) {
        console.log(`  ${c.fullName} · ${c.role} · ${c.email}`);
      }
      console.log(`  GA user.community on record: ${JSON.stringify(gaUser.community)}`);
    }
  }

  // Step-by-step for SRC RA
  console.log("\n========== SRC RA trace ==========\n");
  const src = "Student Residential Complex";
  const ss = await SectionStaff.find({ community: src }).limit(1).lean();
  console.log("SectionStaff sample raEmail:", ss[0]?.raEmail);
  if (ss[0]?.raEmail) {
    const byEmail = await User.findOne({
      email: { $regex: new RegExp(`^${ss[0].raEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      isActive: true,
    }).lean();
    console.log("User by SectionStaff email:", byEmail ? { role: byEmail.role, email: byEmail.email, community: byEmail.community } : null);
  }
  const raOnSrc = await User.find({ role: "RA", community: src }).lean();
  console.log("User.find RA with community array containing SRC:", raOnSrc.map(u => ({ email: u.email, community: u.community, assignment: u.assignment })));

  await mongoose.disconnect();
  console.log("\n========== Done ==========\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
