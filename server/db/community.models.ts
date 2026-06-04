import mongoose, { Document, Model, InferSchemaType } from "mongoose";

interface ICommunity extends Document {
    community: string;
    section: string[];
    updatedAt?: Date;
}

const CommunitySchema = new mongoose.Schema<ICommunity>({
    community: { type: String, required: true, trim: true, unique: true },
    section: { type: [String], default: [] },
    updatedAt: { type: Date, default: Date.now },
});

const Community: Model<ICommunity> = mongoose.models.Community || mongoose.model<ICommunity>('Community', CommunitySchema);

export default Community;
export type CommunityLean = InferSchemaType<typeof CommunitySchema> & {
  _id?: string;
};