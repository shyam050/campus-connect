import mongoose, { Schema, type Model } from 'mongoose';
import type { ResourceType } from '../types';

export interface IPrepSubtopic {
  title: string;
  completed: boolean;
  resources: { title: string; url: string; type: ResourceType }[];
}

export interface IPrepModule {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  subtopics: IPrepSubtopic[];
  targetDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const resourceSchema = new Schema(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, enum: ['video', 'article', 'problem'], default: 'article' },
  },
  { _id: false }
);

const subtopicSchema = new Schema<IPrepSubtopic>(
  {
    title: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
    resources: { type: [resourceSchema], default: [] },
  },
  { _id: false }
);

const prepModuleSchema = new Schema<IPrepModule>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    subtopics: { type: [subtopicSchema], default: [] },
    targetDate: { type: Date },
  },
  { timestamps: true, toJSON: { transform(_doc, ret: Record<string, unknown>) { delete ret.__v; return ret; } } }
);

export const PrepModule: Model<IPrepModule> =
  (mongoose.models.PrepModule as Model<IPrepModule>) ||
  mongoose.model<IPrepModule>('PrepModule', prepModuleSchema);
