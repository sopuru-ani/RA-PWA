import mongoose, { Document, Model } from "mongoose";

export interface IUser extends Document {
    fullName: string;
    firstName: string;
    lastName: string;
    email: string;
    hashedPassword: string;
    studentId?: string;
    role: 'RA' | 'GA' | 'Admin';
    authProvider: 'local' | 'sso';
    providerId?: string;
    community: string[];
    assignment: string[];
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new mongoose.Schema<IUser>({
    fullName: { type: String, required: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, unique: true },
    hashedPassword: { type: String, required: true },
    studentId: { type: String, trim: true, required: function () { return this.role === 'RA' }, unique: true },
    role: { type: String, required: true, enum: ['RA', 'GA', 'Admin'] },
    authProvider: { type: String, required: true, enum: ['local', 'sso'], trim: true },
    providerId: String,
    community: { type: [String], default: [] },
    assignment: { type: [String], defualt: [] },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now }
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

export default User;