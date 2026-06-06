import mongoose, { Document, Model, InferSchemaType } from "mongoose";

export type ProgramStatus =
  | "draft"
  | "pending_approval"
  | "published"
  | "rejected"
  | "cancelled";

export type ProgramCreatorRole = "Admin" | "GA" | "RA" | "SA";

export type ProgramCategory =
  | "staff_meeting"
  | "training"
  | "hall_event"
  | "community_program"
  | "duty"
  | "deadline"
  | "other";

export type ProgramVisibility = "invite_only" | "community" | "department";

export type ProgramAudienceType =
  | "all_staff"
  | "all_ras"
  | "all_gas"
  | "selected_users"
  | "selected_communities"
  | "community_staff";

export type MicrosoftSyncStatus = "none" | "pending" | "synced" | "failed";

interface IProgramAttachment extends Document {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  bucket: string;
  uploadedAt?: Date;
}

export interface IProgram extends Document {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  timezone: string;
  category: ProgramCategory;
  status: ProgramStatus;
  requiredAttendance: boolean;
  visibility: ProgramVisibility;
  communities: string[];
  sections?: string[];
  audience: {
    type: ProgramAudienceType;
    userIds?: mongoose.Types.ObjectId[];
    roles?: ("RA" | "GA" | "SA")[];
  };
  recurrence?: {
    enabled: boolean;
    frequency?: "daily" | "weekly" | "monthly";
    interval?: number;
    daysOfWeek?: number[];
    endDate?: Date;
    parentProgramId?: mongoose.Types.ObjectId;
  };
  createdBy: mongoose.Types.ObjectId;
  createdByRole: ProgramCreatorRole;
  attachments: IProgramAttachment[];
  microsoft?: {
    eventId?: string;
    seriesMasterId?: string;
    lastSyncedAt?: Date;
    syncStatus: MicrosoftSyncStatus;
    syncError?: string;
  };
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  submittedAt?: Date;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new mongoose.Schema<IProgramAttachment>(
  {
    id: { type: String, required: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    bucket: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const ProgramSchema = new mongoose.Schema<IProgram>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    location: { type: String, trim: true },
    timezone: { type: String, required: true, default: "America/Chicago" },
    category: {
      type: String,
      required: true,
      enum: [
        "staff_meeting",
        "training",
        "hall_event",
        "community_program",
        "duty",
        "deadline",
        "other",
      ],
      default: "other",
    },
    status: {
      type: String,
      required: true,
      enum: ["draft", "pending_approval", "published", "rejected", "cancelled"],
      default: "draft",
    },
    requiredAttendance: { type: Boolean, default: false },
    visibility: {
      type: String,
      required: true,
      enum: ["invite_only", "community", "department"],
      default: "invite_only",
    },
    communities: { type: [String], default: [] },
    sections: { type: [String], default: [] },
    audience: {
      type: {
        type: String,
        required: true,
        enum: [
          "all_staff",
          "all_ras",
          "all_gas",
          "selected_users",
          "selected_communities",
          "community_staff",
        ],
      },
      userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      roles: [{ type: String, enum: ["RA", "GA", "SA"] }],
    },
    recurrence: {
      enabled: { type: Boolean, default: false },
      frequency: { type: String, enum: ["daily", "weekly", "monthly"] },
      interval: Number,
      daysOfWeek: [Number],
      endDate: Date,
      parentProgramId: { type: mongoose.Schema.Types.ObjectId, ref: "Program" },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdByRole: {
      type: String,
      required: true,
      enum: ["Admin", "GA", "RA", "SA"],
    },
    attachments: { type: [AttachmentSchema], default: [] },
    microsoft: {
      eventId: String,
      seriesMasterId: String,
      lastSyncedAt: Date,
      syncStatus: {
        type: String,
        enum: ["none", "pending", "synced", "failed"],
        default: "none",
      },
      syncError: String,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
    rejectionReason: String,
    submittedAt: Date,
    publishedAt: Date,
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
);

ProgramSchema.index({ status: 1, startDate: 1 });
ProgramSchema.index({ communities: 1, startDate: 1 });
ProgramSchema.index({ createdBy: 1 });
ProgramSchema.index({ createdByRole: 1, status: 1, startDate: -1 });
ProgramSchema.index({ status: 1, submittedAt: -1 });

const Program: Model<IProgram> =
  mongoose.models.Program ||
  mongoose.model<IProgram>("Program", ProgramSchema);

export default Program;
export type ProgramLean = InferSchemaType<typeof ProgramSchema> & {
  _id?: string;
};
