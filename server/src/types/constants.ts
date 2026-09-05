export const DEPARTMENTS = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'] as const;

export const JOB_TYPES = ['fulltime', 'internship', 'ppo'] as const;

export const APPLICATION_STATUSES = [
  'applied',
  'under_review',
  'shortlisted',
  'interview_scheduled',
  'selected',
  'rejected',
] as const;

/** Stage order used for progress steppers (rejected handled separately). */
export const STATUS_ORDER = [
  'applied',
  'under_review',
  'shortlisted',
  'interview_scheduled',
  'selected',
] as const;

export const RESUME_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const RESUME_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
