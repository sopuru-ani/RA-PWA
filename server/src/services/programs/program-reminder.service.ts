import { Program, ProgramInvite, User } from "../../lib/models.js";
import { sendEmail } from "../email.service.js";

const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;

export type ReminderRunResult = {
  scanned: number;
  sent: number;
  skipped: number;
  errors: string[];
};

export async function sendDueProgramReminders(): Promise<ReminderRunResult> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_MS);

  const upcomingPrograms = await Program.find({
    status: "published",
    startDate: { $gte: now, $lte: windowEnd },
  })
    .select("_id title startDate location")
    .lean();

  const result: ReminderRunResult = {
    scanned: 0,
    sent: 0,
    skipped: 0,
    errors: [],
  };

  for (const program of upcomingPrograms) {
    const invites = await ProgramInvite.find({
      programId: program._id,
      reminderSent: false,
      rsvpStatus: { $ne: "declined" },
    }).lean();

    for (const invite of invites) {
      result.scanned += 1;

      const user = await User.findById(invite.userId)
        .select("email fullName isActive")
        .lean();

      if (!user?.email || !user.isActive) {
        result.skipped += 1;
        continue;
      }

      const when = new Date(program.startDate).toLocaleString("en-US", {
        dateStyle: "full",
        timeStyle: "short",
      });

      try {
        await sendEmail({
          to: user.email,
          subject: `Reminder: ${program.title}`,
          text: [
            `Hi ${user.fullName},`,
            "",
            `This is a reminder for "${program.title}".`,
            `When: ${when}`,
            program.location ? `Where: ${program.location}` : "",
            "",
            "Open Domus to view details and RSVP.",
          ]
            .filter(Boolean)
            .join("\n"),
        });

        await ProgramInvite.updateOne(
          { _id: invite._id },
          { $set: { reminderSent: true, updatedAt: new Date() } },
        );
        result.sent += 1;
      } catch (err) {
        result.errors.push(
          `${user.email}: ${err instanceof Error ? err.message : "send failed"}`,
        );
      }
    }
  }

  return result;
}
