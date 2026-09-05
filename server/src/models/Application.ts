import mongoose, { Schema, type Model } from 'mongoose';
import type { ApplicationStatus } from '../types';

export interface IApplication {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  company: string; // denormalized for analytics ($group without extra lookups)
  role: string; // denormalized for analytics
  status: ApplicationStatus;
  appliedAt: Date;
  resumeUrl: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    company: { type: String, required: true },
    role: { type: String, required: true },
    status: {
      type: String,
      enum: ['applied', 'under_review', 'shortlisted', 'interview_scheduled', 'selected', 'rejected'],
      default: 'applied',
      index: true,
    },
    appliedAt: { type: Date, default: Date.now },
    resumeUrl: { type: String, required: true },
    notes: { type: String },
  },
  { timestamps: true, toJSON: { transform(_doc, ret: Record<string, unknown>) { delete ret.__v; return ret; } } }
);

applicationSchema.index({ studentId: 1, jobId: 1 }, { unique: true });

export const Application: Model<IApplication> =
  (mongoose.models.Application as Model<IApplication>) ||
  mongoose.model<IApplication>('Application', applicationSchema);
