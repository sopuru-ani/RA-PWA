/**
 * Normalize legacy staff User rows and drop stale AuthorizedUser invites.
 * Run: cd server && npx tsx scripts/fix-staff-data.ts
 */
import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import { User, AuthorizedUser, SectionStaff } from "../src/lib/models.js";

const STUDENT_APARTMENTS_GA_EMAIL = "qrmanager.app@gmail.com";
const LEGACY_GA_EMAIL = "akbonsu@umes.edu";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function main(): Promise<void> {
  await mongoose.connect(env.mongodbUri);

  const staffRoles = ["RA", "GA", "SA", "Admin"];

  const missingActive = await User.updateMany(
    {
      role: { $in: staffRoles },
      isActive: { $exists: false },
    },
    { $set: { isActive: true, updatedAt: new Date() } },
  );
  console.log(
    `Set isActive=true on ${missingActive.modifiedCount} staff User(s) missing the field.`,
  );

  const userEmails = await User.find({ role: { $in: staffRoles } }).distinct(
    "email",
  );
  const emailSet = new Set(userEmails.map(normalizeEmail));

  const invites = await AuthorizedUser.find({
    role: { $in: staffRoles },
  }).lean();

  let removedInvites = 0;
  for (const invite of invites) {
    if (emailSet.has(normalizeEmail(invite.email))) {
      await AuthorizedUser.deleteOne({ _id: invite._id });
      removedInvites++;
      console.log(`Removed stale invite (account exists): ${invite.email}`);
    }
  }
  console.log(`Removed ${removedInvites} stale AuthorizedUser invite(s).`);

  const sectionStaff = await SectionStaff.updateMany(
    {
      community: "Student Apartments",
      gaEmail: LEGACY_GA_EMAIL,
    },
    {
      $set: {
        gaEmail: STUDENT_APARTMENTS_GA_EMAIL,
        updatedAt: new Date(),
      },
    },
  );
  console.log(
    `Updated gaEmail on ${sectionStaff.modifiedCount} Student Apartments SectionStaff row(s) (${LEGACY_GA_EMAIL} → ${STUDENT_APARTMENTS_GA_EMAIL}).`,
  );

  await mongoose.disconnect();
  console.log("Done. Re-run: npx tsx scripts/audit-staff-vs-picker.ts");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
