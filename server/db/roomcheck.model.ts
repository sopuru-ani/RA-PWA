import mongoose, { Document, Model, InferSchemaType } from "mongoose";

interface IRoomcheck extends Document {
    community: string;
    section: string;
    room: string;

    residents: {
        studentId: string;
        name: string;
        email: string;
        isPass: boolean;
        notes?: string;
    }[];
    inspectionDate: Date;
    inspectionWeek: string;
    inspectedBy: string
    inspectionSession: string;
    sessionStatus: "in_progress" | "completed";
    createdAt: Date;
    updatedAt: Date;
}

const RoomcheckResidentSchema = new mongoose.Schema({
    studentId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, trim: true },
    isPass: { type: Boolean, required: true },
    notes: String
  },
  { _id: false });

const RoomcheckInspectorSchema = new mongoose.Schema({
    raId: { type: String, required: true },
    name: { type: String, required: true },
  },
  { _id: false });

const RoomcheckSchema = new mongoose.Schema<IRoomcheck>({
    community: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    room: { type: String, required: true, trim: true },
    residents: { type: [RoomcheckResidentSchema], required: true },
    inspectionDate: { type: Date, required: true },
    inspectionWeek: { type: String, required: true, trim: true },
    inspectedBy: { type: String, required: true, trim: true },
    inspectionSession: { type: String, required: true, index: true },
    sessionStatus: { type: String, required: true, enum: ["in_progress", "completed"] },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now }
});

const Roomcheck: Model<IRoomcheck> = mongoose.models.Roomcheck || mongoose.model<IRoomcheck>('Roomcheck', RoomcheckSchema);

export default Roomcheck;

export type RoomcheckLean = InferSchemaType<typeof RoomcheckSchema> & {
  _id?: string;
};

export type InspectionSession = {
  inspectionSession: string;
  title: string;
  inspectionDate: string;
  totalRooms: number;
  completedRooms: number;
}