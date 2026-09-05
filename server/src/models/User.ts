import mongoose, { Schema, type Model } from 'mongoose';
import type { UserRole } from '../types';

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  batch: number;
  cgpa: number;
  backlogs: number;
  isVerified: boolean;
  isActive: boolean;
  refreshToken?: string;
  prepActivity: Date[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['student', 'coordinator', 'admin'],
      default: 'student',
      index: true,
    },
    department: { type: String, required: true, uppercase: true, trim: true },
    batch: { type: Number, required: true },
    cgpa: { type: Number, default: 0, min: 0, max: 10 },
    backlogs: { type: Number, default: 0, min: 0 },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    refreshToken: { type: String, select: false },
    prepActivity: { type: [Date], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.index({ role: 1, department: 1, cgpa: -1 });

export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', userSchema);
