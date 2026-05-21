import mongoose, { Document, Model, InferSchemaType } from "mongoose";

interface IResident extends Document {
    fullName: string;
    firstName: string;
    lastName: string;
    email: string;
    studentId: string;
    community: string;
    section: string;
    room: string;
    raEmail: string;
    gaEmail: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ResidentSchema = new mongoose.Schema<IResident>({
    fullName: { type: String, required: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    studentId: { type: String, required: true, unique: true, trim: true },
    community: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    room: { type: String, required: true, trim: true },
    raEmail: { type: String, required: true, trim: true },
    gaEmail: { type: String, required: true, trim: true },
    notes: String,
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now }
});

const Resident: Model<IResident> = mongoose.models.Resident || mongoose.model<IResident>('Resident', ResidentSchema)

export default Resident;
export type ResidentLean = InferSchemaType<typeof ResidentSchema> & {
  _id: string;
};