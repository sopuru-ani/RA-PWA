import mongoose, { Document, Model, InferSchemaType } from "mongoose";

export interface IRoom extends Document {
    community: string;
    section: string;
    room: string;
    capacity: number;
    keyCount?: number;
    keyCode?: string;
    createdAt: Date;
}

const RoomSchema = new mongoose.Schema<IRoom>({
    community: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    room: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, trim: true },
    keyCount: { type: Number, required: false, trim: true, default: 0 },
    keyCode: { type: String, required: false, trim: true },
    createdAt: { type: Date, required: true, default: Date.now },
});

RoomSchema.index({ community: 1, section: 1, room: 1 }, { unique: true });

const Room: Model<IRoom> = mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);

export default Room;
export type RoomLean = InferSchemaType<typeof RoomSchema> & {
  _id: string;
};

/** Vacancy is derived at read time; not stored on Room documents. */
export type RoomWithVacancy = RoomLean & { vacancy: number };