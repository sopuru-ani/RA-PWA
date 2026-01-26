import mongoose, { Document, Model, InferSchemaType } from "mongoose";

export interface IRoom extends Document {
    community: string;
    section: string;
    room: string;
    capacity: number;
    vacancy: number;
    createdAt: Date;
}

const RoomSchema = new mongoose.Schema<IRoom>({
    community: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    room: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, trim: true },
    vacancy: { type: Number, required: true, trim: true },
    createdAt: { type: Date, required: true, default: Date.now },
});

const Room: Model<IRoom> = mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);

export default Room;
export type RoomLean = InferSchemaType<typeof RoomSchema> & {
  _id: string;
};