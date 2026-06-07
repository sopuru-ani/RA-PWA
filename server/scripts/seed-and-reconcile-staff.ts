/**
 * Reconcile Student Apartments RA/SectionStaff and seed Student Residential Complex staff.
 * Creates AuthorizedUser invites (signup still required for passwords).
 *
 * Run: cd server && npx tsx scripts/seed-and-reconcile-staff.ts
 * Dry run: DRY_RUN=1 npx tsx scripts/seed-and-reconcile-staff.ts
 */
import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import {
  User,
  AuthorizedUser,
  SectionStaff,
  Community,
} from "../src/lib/models.js";
import {
  inviteStaff,
  syncSectionStaffForRa,
} from "../src/services/admin/staff.service.js";
import { applyStaffAssignments } from "../src/services/admin/assignment.service.js";

const DRY_RUN = process.env.DRY_RUN === "1";

const STUDENT_APARTMENTS = "Student Apartments";
const SRC = "Student Residential Complex";

/** Dev placeholder staff for SRC — signup via /signup with these emails after running. */
const SRC_STAFF = {
  ga: { email: "src-ga@umes.edu", role: "GA" as const },
  sa: { email: "src-sa@umes.edu", role: "SA" as const },
  ra: { email: "src-ra@umes.edu", role: "RA" as const },
};

function log(msg: string): void {
  console.log(msg);
}

async function ensureAuthorizedInvite(opts: {
  email: string;
  role: "RA" | "GA" | "SA";
  community: string;
  assignment?: string;
}): Promise<"created" | "exists-user" | "exists-invite" | "skipped"> {
  const email = opts.email.trim().toLowerCase();
  const displayEmail = opts.email.trim();

  const existingUser = await User.findOne({ email: displayEmail });
  if (existingUser) {
    log(`  invite skip (account exists): ${displayEmail} [${opts.role}]`);
    return "exists-user";
  }

  const existingInvite = await AuthorizedUser.findOne({ email: displayEmail });
  if (existingInvite) {
    log(`  invite exists: ${displayEmail} [${opts.role}]`);
    return "exists-invite";
  }

  if (DRY_RUN) {
    log(`  [dry-run] would invite: ${displayEmail} [${opts.role}]`);
    return "skipped";
  }

  await inviteStaff({
    email: displayEmail,
    role: opts.role,
    isActive: true,
    community: [opts.community],
    assignment: opts.assignment ? [opts.assignment] : [],
  });
  log(`  invite created: ${displayEmail} [${opts.role}]`);
  return "created";
}

async function getSrcSections(): Promise<string[]> {
  const communityDoc = await Community.findOne({ community: SRC }).lean();
  if (communityDoc?.section?.length) {
    return communityDoc.section;
  }
  return [
    "Student Residential Complex 1",
    "Student Residential Complex 2",
    "Student Residential Complex 3",
    "Student Residential Complex 4",
    "Student Residential Complex 5",
    "Student Residential Complex 6",
  ];
}

async function reconcileStudentApartments(srcPrimarySection: string): Promise<void> {
  log("\n=== Reconcile Student Apartments ===\n");

  const sectionStaffRaEmail = (
    await SectionStaff.findOne({ community: STUDENT_APARTMENTS }).lean()
  )?.raEmail?.trim();

  const raUsers = await User.find({ role: "RA" }).lean();
  const aptRas = raUsers.filter((u) =>
    (u.community ?? []).includes(STUDENT_APARTMENTS),
  );

  log(`SectionStaff RA email: ${sectionStaffRaEmail ?? "(none)"}`);
  log(`User RAs with community "${STUDENT_APARTMENTS}": ${aptRas.length}`);

  if (!sectionStaffRaEmail) {
    log("No SectionStaff for Student Apartments — skipping RA reconcile.");
    return;
  }

  const canonical = sectionStaffRaEmail.toLowerCase();
  const primary = aptRas.find(
    (u) => u.email.trim().toLowerCase() === canonical,
  );
  const extras = aptRas.filter(
    (u) => u.email.trim().toLowerCase() !== canonical,
  );

  if (primary) {
    log(`Primary RA account matches SectionStaff: ${primary.email}`);
  } else {
    log(
      `No User account for SectionStaff RA (${sectionStaffRaEmail}) — invite or signup needed.`,
    );
  }

  for (const extra of extras) {
    log(
      `Extra RA on Student Apartments (not in SectionStaff): ${extra.email} — reassigning to ${SRC}`,
    );
    if (DRY_RUN) continue;

    const updated = await User.findByIdAndUpdate(
      extra._id,
      {
        $set: {
          community: [SRC],
          assignment: [srcPrimarySection],
          updatedAt: new Date(),
        },
      },
      { new: true },
    );
    if (updated) {
      await applyStaffAssignments(updated, {
        userId: String(updated._id),
        isActive: true,
      });
    }
  }
}

async function seedSrcSectionStaff(
  gaEmail: string,
  raEmail: string,
  sections: string[],
): Promise<void> {
  log("\n=== Seed SectionStaff for Student Residential Complex ===\n");

  const communityDoc = await Community.findOne({ community: SRC }).lean();

  if (!communityDoc?.section?.length && !DRY_RUN) {
    await Community.updateOne(
      { community: SRC },
      { $set: { section: sections, updatedAt: new Date() } },
    );
    log(`Set Community.section for ${SRC} (${sections.length} sections).`);
  }

  for (const section of sections) {
    const existing = await SectionStaff.findOne({
      community: SRC,
      section,
    }).lean();

    if (existing) {
      if (
        existing.raEmail?.trim().toLowerCase() !== raEmail.toLowerCase() ||
        existing.gaEmail?.trim().toLowerCase() !== gaEmail.toLowerCase()
      ) {
        if (DRY_RUN) {
          log(`  [dry-run] would update SectionStaff ${section}`);
        } else {
          await SectionStaff.updateOne(
            { community: SRC, section },
            { $set: { raEmail, gaEmail, community: SRC, section } },
          );
          log(`  updated SectionStaff: ${section}`);
        }
      } else {
        log(`  SectionStaff ok: ${section}`);
      }
      continue;
    }

    if (DRY_RUN) {
      log(`  [dry-run] would create SectionStaff: ${section}`);
      continue;
    }

    await SectionStaff.create({
      community: SRC,
      section,
      raEmail,
      gaEmail,
    });
    log(`  created SectionStaff: ${section}`);
  }
}

async function alignSrcWithExistingRaAccount(): Promise<void> {
  log("\n=== Align SRC SectionStaff with existing RA account ===\n");

  const srcRas = await User.find({ role: "RA", community: SRC });
  const existingRa =
    srcRas.find((r) => r.email.trim().toLowerCase() !== "src-ra@umes.edu") ??
    null;

  if (!existingRa) {
    log("No signed-up RA on SRC yet — SectionStaff uses invite email until signup.");
    return;
  }

  const email = existingRa.email.trim();
  log(`Using existing RA account for SectionStaff: ${email}`);

  if (DRY_RUN) {
    log("  [dry-run] would update SectionStaff raEmail and remove src-ra invite");
    return;
  }

  await SectionStaff.updateMany({ community: SRC }, { $set: { raEmail: email } });
  await applyStaffAssignments(existingRa, {
    userId: String(existingRa._id),
    isActive: true,
  });

  const redundantInvite = await AuthorizedUser.findOne({
    email: "src-ra@umes.edu",
  });
  if (redundantInvite) {
    await AuthorizedUser.deleteOne({ _id: redundantInvite._id });
    log("  removed redundant src-ra@umes.edu invite");
  }
}

async function syncExistingSrcUsers(): Promise<void> {
  const gaUser = await User.findOne({
    email: SRC_STAFF.ga.email,
    role: "GA",
  });
  if (gaUser && gaUser.isActive !== false) {
    if (DRY_RUN) {
      log(`  [dry-run] would sync CommunityStaff for existing GA`);
    } else {
      await applyStaffAssignments(gaUser, {
        userId: String(gaUser._id),
        isActive: true,
      });
      log(`  synced CommunityStaff for GA account`);
    }
  }

  const raUser = await User.findOne({
    email: SRC_STAFF.ra.email,
    role: "RA",
  });
  if (
    raUser &&
    raUser.isActive !== false &&
    raUser.community?.[0] &&
    raUser.assignment?.[0]
  ) {
    if (DRY_RUN) {
      log(`  [dry-run] would sync SectionStaff for existing RA`);
    } else {
      await syncSectionStaffForRa(
        raUser.community[0],
        raUser.assignment[0],
        raUser.email,
        SRC_STAFF.ga.email,
      );
      log(`  synced SectionStaff for RA account`);
    }
  }
}

async function main(): Promise<void> {
  log(DRY_RUN ? "DRY RUN — no writes\n" : "LIVE RUN — writing to DB\n");

  await mongoose.connect(env.mongodbUri);

  const srcSections = await getSrcSections();
  const srcPrimarySection = srcSections[0];

  await reconcileStudentApartments(srcPrimarySection);

  log("\n=== Invites for Student Residential Complex ===\n");
  log("(Signup at /signup with these emails + password after invites exist.)\n");

  await ensureAuthorizedInvite({
    email: SRC_STAFF.ga.email,
    role: "GA",
    community: SRC,
  });
  await ensureAuthorizedInvite({
    email: SRC_STAFF.sa.email,
    role: "SA",
    community: SRC,
  });
  await ensureAuthorizedInvite({
    email: SRC_STAFF.ra.email,
    role: "RA",
    community: SRC,
    assignment: srcPrimarySection,
  });

  const gaEmailForSections =
    (await User.findOne({ email: SRC_STAFF.ga.email }))?.email ??
    SRC_STAFF.ga.email;
  const raEmailForSections =
    (await User.findOne({ email: SRC_STAFF.ra.email }))?.email ??
    SRC_STAFF.ra.email;

  await seedSrcSectionStaff(gaEmailForSections, raEmailForSections, srcSections);
  await alignSrcWithExistingRaAccount();
  await syncExistingSrcUsers();

  log("\n=== Summary ===\n");
  log("Student Apartments: extra RA(s) moved to Student Residential Complex if any.");
  log("SRC pending invites (signup at /login → sign up):");
  log(`  GA: ${SRC_STAFF.ga.email}`);
  log(`  SA: ${SRC_STAFF.sa.email}`);
  const srcRa = await User.findOne({ role: "RA", community: SRC });
  if (srcRa) {
    log(`  RA: existing account on SRC (SectionStaff aligned)`);
  } else {
    log(`  RA: invite pending — use signup after invite`);
  }
  log("\nRe-run audit: npx tsx scripts/audit-staff-resolution.ts\n");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
