import mongoose, { Document, Model, InferSchemaType } from "mongoose";

interface ISectionStaff extends Document {
  community: string;
  section: string;
  raEmail: string;
  gaEmail: string;
}

const SectionStaffSchema = new mongoose.Schema<ISectionStaff>({
  community: { type: String, required: true, trim: true },
  section: { type: String, required: true, trim: true },
  raEmail: { type: String, required: true, trim: true },
  gaEmail: { type: String, required: true, trim: true },
});

// compound index so lookups by community + section are fast
// also prevents duplicate entries for the same community/section pair
SectionStaffSchema.index({ community: 1, section: 1 }, { unique: true });

const SectionStaff: Model<ISectionStaff> =
  mongoose.models.SectionStaff ||
  mongoose.model<ISectionStaff>("SectionStaff", SectionStaffSchema);

export default SectionStaff;
export type SectionStaffLean = InferSchemaType<typeof SectionStaffSchema> & {
  _id?: string;
};