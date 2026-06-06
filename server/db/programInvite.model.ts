import mongoose, { Document, Model, InferSchemaType } from "mongoose";

export type RsvpStatus = "pending" | "accepted" | "declined" | "tentative";

export type AttendanceStatus = "unmarked" | "absent" | "attended" | "excused";

export type InviteMicrosoftSyncStatus = "none" | "pending" | "synced" | "failed";

export interface IProgramInvite extends Document {
  programId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  rsvpStatus: RsvpStatus;
  attendanceStatus: AttendanceStatus;
  syncedToCalendar: boolean;
  microsoft?: {
    eventId?: string;
    lastSyncedAt?: Date;
    syncStatus: InviteMicrosoftSyncStatus;
  };
  reminderSent: boolean;
  checkedInAt?: Date;
  checkedInBy?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProgramInviteSchema = new mongoose.Schema<IProgramInvite>(
  {
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rsvpStatus: {
      type: String,
      required: true,
      enum: ["pending", "accepted", "declined", "tentative"],
      default: "pending",
    },
    attendanceStatus: {
      type: String,
      required: true,
      enum: ["unmarked", "absent", "attended", "excused"],
      default: "unmarked",
    },
    syncedToCalendar: { type: Boolean, default: false },
    microsoft: {
      eventId: String,
      lastSyncedAt: Date,
      syncStatus: {
        type: String,
        enum: ["none", "pending", "synced", "failed"],
        default: "none",
      },
    },
    reminderSent: { type: Boolean, default: false },
    checkedInAt: Date,
    checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    notes: String,
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
);

ProgramInviteSchema.index({ programId: 1, userId: 1 }, { unique: true });
ProgramInviteSchema.index({ userId: 1, programId: 1 });
ProgramInviteSchema.index({ programId: 1 });
ProgramInviteSchema.index({ reminderSent: 1, programId: 1 });

const ProgramInvite: Model<IProgramInvite> =
  mongoose.models.ProgramInvite ||
  mongoose.model<IProgramInvite>("ProgramInvite", ProgramInviteSchema);

export default ProgramInvite;
export type ProgramInviteLean = InferSchemaType<typeof ProgramInviteSchema> & {
  _id?: string;
};
