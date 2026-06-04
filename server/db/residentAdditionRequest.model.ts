import mongoose, { Document, Model, InferSchemaType } from "mongoose";

export type ResidentRequestStatus = "pending" | "approved" | "rejected";

export type ResidentRequestSubmitterRole = "GA" | "SA";

export interface IResidentAdditionRequest extends Document {
  status: ResidentRequestStatus;
  community: string;
  section: string;
  room: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  notes?: string;
  submittedBy: mongoose.Types.ObjectId;
  submittedByRole: ResidentRequestSubmitterRole;
  submittedByEmail: string;
  batchId?: string;
  batchRowIndex?: number;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ResidentAdditionRequestSchema = new mongoose.Schema<IResidentAdditionRequest>(
  {
    status: {
      type: String,
      required: true,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    community: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    room: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    studentId: { type: String, required: true, trim: true },
    notes: String,
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

ResidentAdditionRequestSchema.index({ status: 1, community: 1, createdAt: -1 });
ResidentAdditionRequestSchema.index({ submittedBy: 1, status: 1, createdAt: -1 });
ResidentAdditionRequestSchema.index({ batchId: 1 });
ResidentAdditionRequestSchema.index(
  { email: 1, status: 1 },
  { partialFilterExpression: { status: "pending" } },
);

const ResidentAdditionRequest: Model<IResidentAdditionRequest> =
  mongoose.models.ResidentAdditionRequest ||
  mongoose.model<IResidentAdditionRequest>(
    "ResidentAdditionRequest",
    ResidentAdditionRequestSchema,
  );

export default ResidentAdditionRequest;

export type ResidentAdditionRequestLean = InferSchemaType<
  typeof ResidentAdditionRequestSchema
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
