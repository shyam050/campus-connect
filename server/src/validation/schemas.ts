import { z } from 'zod';
import { APPLICATION_STATUSES, DEPARTMENTS, JOB_TYPES } from '../types/constants';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
  department: z.enum(DEPARTMENTS),
  batch: z.coerce.number().int().min(2020).max(2035),
  cgpa: z.coerce.number().min(0).max(10).default(0),
  backlogs: z.coerce.number().int().min(0).max(20).default(0),
});

export const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
});

export const jobSchema = z.object({
  company: z.string().min(2, 'Company required').max(80),
  role: z.string().min(2, 'Role required').max(80),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  type: z.enum(JOB_TYPES),
  eligibility: z.object({
    minCgpa: z.coerce.number().min(0).max(10),
    maxBacklogs: z.coerce.number().int().min(0).max(20).default(0),
    departments: z.array(z.enum(DEPARTMENTS)).min(1, 'Select at least one department'),
    batch: z.coerce.number().int().min(2020).max(2035),
  }),
  deadline: z.coerce.date(),
  salary: z
    .object({
      min: z.coerce.number().positive(),
      max: z.coerce.number().positive(),
      currency: z.string().default('INR'),
    })
    .optional(),
  location: z.string().min(2, 'Location required').max(120),
});

export const updateJobSchema = jobSchema.partial().extend({
  status: z.enum(['open', 'closed']).optional(),
});

export const listJobsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(100).optional(),
  type: z.enum(JOB_TYPES).optional(),
  company: z.string().trim().max(80).optional(),
  status: z.enum(['open', 'closed']).optional(),
  mine: z.enum(['true', 'false']).optional(),
});

export const applicationStatusSchema = z.object({
  status: z.enum(APPLICATION_STATUSES),
  notes: z.string().max(1000).optional(),
});

export const listApplicationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  jobId: z.string().optional(),
  status: z.enum(APPLICATION_STATUSES).optional(),
});

export const createModuleSchema = z.object({
  title: z.string().min(2).max(60),
  targetDate: z.coerce.date().optional(),
  subtopics: z
    .array(
      z.object({
        title: z.string().min(2).max(120),
        completed: z.boolean().default(false),
        resources: z
          .array(
            z.object({
              title: z.string().min(1),
              url: z.string().url(),
              type: z.enum(['video', 'article', 'problem']).default('article'),
            })
          )
          .default([]),
      })
    )
    .default([]),
});

export const addSubtopicSchema = z.object({
  title: z.string().min(2).max(120),
  resources: z
    .array(
      z.object({
        title: z.string().min(1),
        url: z.string().url(),
        type: z.enum(['video', 'article', 'problem']).default('article'),
      })
    )
    .default([]),
});

export const toggleSubtopicSchema = z.object({
  completed: z.boolean(),
});

export const updateModuleSchema = z.object({
  title: z.string().min(2).max(60).optional(),
  targetDate: z.coerce.date().nullable().optional(),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  role: z.enum(['student', 'coordinator', 'admin']).optional(),
  department: z.string().trim().max(20).optional(),
});

export const updateUserSchema = z.object({
  role: z.enum(['student', 'coordinator', 'admin']).optional(),
  isVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
  department: z.enum(DEPARTMENTS).optional(),
  batch: z.coerce.number().int().min(2020).max(2035).optional(),
  cgpa: z.coerce.number().min(0).max(10).optional(),
  backlogs: z.coerce.number().int().min(0).max(20).optional(),
});

export const bulkVerifySchema = z.object({
  userIds: z.array(z.string()).min(1).max(200),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').max(72),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(80).optional(),
});
