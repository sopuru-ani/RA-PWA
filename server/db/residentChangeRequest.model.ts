import mongoose, { Document, Model, InferSchemaType } from "mongoose";

export type ResidentChangeRequestStatus = "pending" | "approved" | "rejected";

export type ResidentChangeRequestType = "add" | "update" | "remove";

export type ResidentChangeSubmitterRole = "GA" | "SA";

export interface IResidentChangeRequest extends Document {
  requestType: ResidentChangeRequestType;
  status: ResidentChangeRequestStatus;
  residentId?: mongoose.Types.ObjectId;
  community: string;
  section: string;
  room: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  notes?: string;
  previousSnapshot?: Record<string, unknown>;
  removalReason?: string;
  submittedBy: mongoose.Types.ObjectId;
  submittedByRole: ResidentChangeSubmitterRole;
  submittedByEmail: string;
  batchId?: string;
  batchRowIndex?: number;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ResidentChangeRequestSchema = new mongoose.Schema<IResidentChangeRequest>(
  {
    requestType: {
      type: String,
      required: true,
      enum: ["add", "update", "remove"],
      default: "add",
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    residentId: { type: mongoose.Schema.Types.ObjectId, ref: "Resident" },
    community: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    room: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    studentId: { type: String, required: true, trim: true },
    notes: String,
    previousSnapshot: { type: mongoose.Schema.Types.Mixed },
    removalReason: String,
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    submittedByRole: {
      type: String,
      required: true,
      enum: ["GA", "SA"],
    },
    submittedByEmail: { type: String, required: true, trim: true },
    batchId: { type: String, trim: true },
    batchRowIndex: Number,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
    rejectionReason: String,
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
);

ResidentChangeRequestSchema.index({ status: 1, community: 1, createdAt: -1 });
ResidentChangeRequestSchema.index({ submittedBy: 1, status: 1, createdAt: -1 });
ResidentChangeRequestSchema.index({ batchId: 1 });
ResidentChangeRequestSchema.index(
  { email: 1, status: 1 },
  { partialFilterExpression: { status: "pending" } },
);
ResidentChangeRequestSchema.index(
  { residentId: 1, status: 1 },
  { partialFilterExpression: { status: "pending" } },
);

const ResidentChangeRequest: Model<IResidentChangeRequest> =
  mongoose.models.ResidentChangeRequest ||
  mongoose.model<IResidentChangeRequest>(
    "ResidentChangeRequest",
    ResidentChangeRequestSchema,
    "residentadditionrequests",
  );

export default ResidentChangeRequest;

export type ResidentChangeRequestLean = InferSchemaType<
  typeof ResidentChangeRequestSchema
> & { _id: string };

export type ResidentRequestPayload = {
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  studentId: string;
  community: string;
  section: string;
  room: string;
  notes?: string;
};

export type ResidentUpdateRequestPayload = {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  studentId?: string;
  notes?: string;
};

export const GA_UPDATABLE_FIELDS = [
  "firstName",
  "lastName",
  "fullName",
  "email",
  "studentId",
  "notes",
] as const;
