import mongoose, { Schema, type Model } from 'mongoose';
import type { JobType } from '../types';

export interface IEligibility {
  minCgpa: number;
  maxBacklogs: number;
  departments: string[];
  batch: number;
}

export interface IJob {
  _id: mongoose.Types.ObjectId;
  company: string;
  role: string;
  description: string;
  type: JobType;
  eligibility: IEligibility;
  deadline: Date;
  salary?: { min: number; max: number; currency: string };
  location: string;
  postedBy: mongoose.Types.ObjectId;
  applicants: mongoose.Types.ObjectId[];
  status: 'open' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

const eligibilitySchema = new Schema<IEligibility>(
  {
    minCgpa: { type: Number, required: true, min: 0, max: 10 },
    maxBacklogs: { type: Number, required: true, min: 0, default: 0 },
    departments: { type: [String], required: true },
    batch: { type: Number, required: true },
  },
  { _id: false }
);

const jobSchema = new Schema<IJob>(
  {
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['fulltime', 'internship', 'ppo'], required: true },
    eligibility: { type: eligibilitySchema, required: true },
    deadline: { type: Date, required: true },
    salary: {
      type: {
        min: { type: Number, required: true },
        max: { type: Number, required: true },
        currency: { type: String, default: 'INR' },
      },
      _id: false,
    },
    location: { type: String, required: true, trim: true },
    postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    applicants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['open', 'closed'], default: 'open', index: true },
  },
  { timestamps: true, toJSON: { transform(_doc, ret: Record<string, unknown>) { delete ret.__v; return ret; } } }
);

jobSchema.index({ status: 1, deadline: 1 });
jobSchema.index({ 'eligibility.departments': 1 });
jobSchema.index({ company: 'text', role: 'text', description: 'text' });

export const Job: Model<IJob> =
  (mongoose.models.Job as Model<IJob>) || mongoose.model<IJob>('Job', jobSchema);
