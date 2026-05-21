import mongoose, { Document, Model } from "mongoose";

export interface IAuthorized extends Document {
    email: string;
    role: 'RA' | 'GA' | 'Admin';
    isActive: boolean;
    community?: string[],
    assignment?: string[],
    createdAt: Date;
    expiresAt?: Date;
    notes?: string;
}

const AuthorizedUserSchema = new mongoose.Schema<IAuthorized>({
    email: { type: String, required: true, trim: true, unique: true },
    role: { type: String, required: true, enum: ['RA', 'Admin', 'GA'], trim: true },
    isActive: { type: Boolean, required: true },
    community: { type: [String], default: [] },
    assignment: { type: [String], default: [] },
    createdAt: { type: Date, required: true, default: Date.now },
    expiresAt: Date,
    notes: String
});

const AuthorizedUser: Model<IAuthorized> = mongoose.models.AuthorizedUser || mongoose.model<IAuthorized>('AuthorizedUser', AuthorizedUserSchema)

export default AuthorizedUser;