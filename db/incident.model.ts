import mongoose, { Document, Model, InferSchemaType } from "mongoose";

interface IAttachment extends Document {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  bucket: string;
  uploadedAt?: Date;
}

export interface IIncident extends Document {
  community?: string;
  section?: string;
  room?: string;
  location?: string;
  reporter: string;
  involved?: string[];
  type: "Policy Violation" | "Maintenance" | "Health and Safety" | "Other";
  title: string;
  description: string;
  attachments?: IAttachment[];
  incidentDate: Date;
  createdAt: Date;
  resolved?: boolean;
  resolvedAt?: Date;
}


const AttachmentSchema = new mongoose.Schema<IAttachment>({
  id: { type: String, required: true },
  filename: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  bucket: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const IncidentSchema = new mongoose.Schema<IIncident>({
    community: { type: String, trim: true },
    section: { type: String, trim: true },
    room: { type: String, trim: true },
    location: { type: String, trim: true },
    reporter: { type: String, required: true, trim: true },
    involved: { type: [String], default: [] },
    type: { type: String, required: true, enum: ["Policy Violation", "Maintenance", "Health and Safety", "Other"], trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    attachments: { type: [AttachmentSchema], default: [] },
    incidentDate: { type: Date, required: true, default: Date.now },
    createdAt: { type: Date, required: true, default: Date.now },
    resolved: { type: Boolean, default: false },
    resolvedAt: { type: Date }
});

const Incident: Model<IIncident> = mongoose.models.Incident || mongoose.model<IIncident>('Incident', IncidentSchema);

export default Incident;
export type IncidentLean = InferSchemaType<typeof IncidentSchema> & {
  _id?: string;
};
