interface StudentLike {
  cgpa: number;
  backlogs: number;
  department: string;
  batch: number;
}

interface JobLike {
  eligibility: {
    minCgpa: number;
    maxBacklogs: number;
    departments: string[];
    batch: number;
  };
  deadline: Date;
  status: string;
}

export function isEligible(student: StudentLike, job: JobLike): boolean {
  // CGPA check
  if (student.cgpa < job.eligibility.minCgpa) return false;

  // Backlog check
  if (student.backlogs > job.eligibility.maxBacklogs) return false;

  // Department check
  if (!job.eligibility.departments.includes(student.department)) return false;

  // Batch check (graduation year)
  if (job.eligibility.batch && student.batch !== job.eligibility.batch) return false;

  return true;
}

export function isApplyOpen(job: JobLike): boolean {
  return job.status === 'open' && job.deadline.getTime() > Date.now();
}
