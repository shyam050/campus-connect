// ── Mirrors the server's API contract (src/types/index.ts) ────

export type UserRole = 'student' | 'coordinator' | 'admin';
export type JobType = 'fulltime' | 'internship' | 'ppo';
export type JobStatus = 'open' | 'closed';

export type ApplicationStatus =
  | 'applied'
  | 'under_review'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'selected'
  | 'rejected';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  batch: number;
  cgpa: number;
  backlogs: number;
  isVerified: boolean;
  isActive: boolean;
  prepActivity?: string[];
  createdAt: string;
}

export interface Job {
  _id: string;
  company: string;
  role: string;
  description: string;
  type: JobType;
  eligibility: {
    minCgpa: number;
    maxBacklogs: number;
    departments: string[];
    batch: number;
  };
  deadline: string;
  salary?: { min: number; max: number; currency: string };
  location: string;
  postedBy: Pick<User, '_id' | 'name' | 'email'> | string;
  applicants: string[];
  status: JobStatus;
  createdAt: string;
}

export interface Application {
  _id: string;
  studentId: Pick<User, '_id' | 'name' | 'email' | 'department' | 'cgpa' | 'backlogs' | 'isVerified'> | string;
  jobId: Pick<Job, '_id' | 'company' | 'role' | 'location' | 'deadline' | 'status' | 'type' | 'salary'> | string;
  company: string;
  role: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  resumeUrl: string;
  notes?: string;
}

export type ResourceType = 'video' | 'article' | 'problem';

export interface PrepSubtopic {
  title: string;
  completed: boolean;
  resources: { title: string; url: string; type: ResourceType }[];
}

export interface PrepModule {
  _id: string;
  userId: string;
  title: string;
  subtopics: PrepSubtopic[];
  targetDate?: string | null;
  createdAt: string;
  progress?: number;
}

export interface PrepSummary {
  modules: PrepModule[];
  overall: number;
  streak: number;
}

export interface DepartmentStat {
  department: string;
  totalOffers: number;
  avgCgpa: number;
  uniqueCompanies: number;
}

export interface Analytics {
  departmentStats: DepartmentStat[];
  statusDistribution: { _id: ApplicationStatus; count: number }[];
  monthlyTrend: { month: string; applications: number }[];
  topCompanies: { _id: string; applications: number }[];
  overview: {
    totalStudents: number;
    coordinators: number;
    totalJobs: number;
    openJobs: number;
    totalApplications: number;
    offers: number;
    placedStudents: number;
    placementRate: number;
  };
}

export interface Meta {
  page: number;
  limit: number;
  total: number;
}

export interface ApiEnvelope<T> {
  status: 'success' | 'error';
  data: T;
  meta?: Meta;
  error?: string;
  code?: string;
}

export const DEPARTMENTS = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'] as const;

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: 'Applied',
  under_review: 'Under Review',
  shortlisted: 'Shortlisted',
  interview_scheduled: 'Interview Scheduled',
  selected: 'Selected',
  rejected: 'Rejected',
};

export const STATUS_ORDER: ApplicationStatus[] = [
  'applied',
  'under_review',
  'shortlisted',
  'interview_scheduled',
  'selected',
];

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'applied',
  'under_review',
  'shortlisted',
  'interview_scheduled',
  'selected',
  'rejected',
];

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  fulltime: 'Full-time',
  internship: 'Internship',
  ppo: 'PPO',
};
