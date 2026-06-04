import mongoose, { Document, Model, InferSchemaType } from "mongoose";

export interface ICommunityStaff extends Document {
  community: string;
  userId: mongoose.Types.ObjectId;
  role: "GA" | "SA";
  email: string;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommunityStaffSchema = new mongoose.Schema<ICommunityStaff>({
  community: { type: String, required: true, trim: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, required: true, enum: ["GA", "SA"], trim: true },
  email: { type: String, required: true, trim: true },
  isActive: { type: Boolean, required: true, default: true },
  notes: String,
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
});

CommunityStaffSchema.index(
  { community: 1, userId: 1, role: 1 },
  { unique: true },
);

const CommunityStaff: Model<ICommunityStaff> =
  mongoose.models.CommunityStaff ||
  mongoose.model<ICommunityStaff>("CommunityStaff", CommunityStaffSchema);

export default CommunityStaff;
export type CommunityStaffLean = InferSchemaType<
  typeof CommunityStaffSchema
> & {
  _id?: string;
};
