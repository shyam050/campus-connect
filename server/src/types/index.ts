// ── User & Auth ───────────────────────────────────────────────

export type UserRole = 'student' | 'coordinator' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  password: string; // bcrypt hashed
  role: UserRole;
  department: string; // CSE, ECE, MECH, etc.
  batch: number; // graduation year, e.g. 2026
  cgpa: number;
  backlogs: number;
  isVerified: boolean;
  isActive: boolean;
  refreshToken?: string;
  createdAt: Date;
}

// ── Job ───────────────────────────────────────────────────────

export type JobType = 'fulltime' | 'internship' | 'ppo';

export interface Job {
  _id: string;
  company: string;
  role: string;
  description: string;
  type: JobType;
  eligibility: {
    minCgpa: number;
    maxBacklogs: number;
    departments: string[]; // ["CSE", "ECE"]
    batch: number; // 2024, 2025
  };
  deadline: Date;
  salary?: { min: number; max: number; currency: string };
  location: string;
  postedBy: string; // Coordinator ID
  applicants: string[]; // User IDs
  status: 'open' | 'closed';
  createdAt: Date;
}

// ── Application ───────────────────────────────────────────────

export type ApplicationStatus =
  | 'applied'
  | 'under_review'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'selected'
  | 'rejected';

export interface Application {
  _id: string;
  studentId: string;
  jobId: string;
  company: string; // denormalized for analytics
  role: string; // denormalized for analytics
  status: ApplicationStatus;
  appliedAt: Date;
  resumeUrl: string; // Cloudinary URL (or local fallback)
  notes?: string; // Coordinator notes
  updatedAt: Date;
}

// ── Prep Module ───────────────────────────────────────────────

export type ResourceType = 'video' | 'article' | 'problem';

export interface PrepSubtopic {
  title: string;
  completed: boolean;
  resources: { title: string; url: string; type: ResourceType }[];
}

export interface PrepModule {
  _id: string;
  userId: string;
  title: string; // "DSA", "System Design", "Aptitude"
  subtopics: PrepSubtopic[];
  targetDate?: Date;
  createdAt: Date;
}

// ── Auth / API ────────────────────────────────────────────────

export interface AuthUser {
  userId: string;
  role: UserRole;
  department: string;
}
