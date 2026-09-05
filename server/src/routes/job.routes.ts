import { Router } from 'express';
import { authenticate, authorize } from '../auth/jwt';
import {
  applyToJob,
  createJob,
  deleteJob,
  getJob,
  listApplicants,
  listJobs,
  sendReminders,
  updateJob,
} from '../controllers/job.controller';
import { resumeUpload } from '../middleware/upload';
import { listJobsQuerySchema, jobSchema, updateJobSchema } from '../validation/schemas';
import { validate } from '../middleware/validate';
import { wrap } from '../middleware/async';

const router = Router();

// Any authenticated user can browse jobs (student view is eligibility-filtered)
router.get('/', authenticate, validate(listJobsQuerySchema, 'query'), wrap(listJobs));
router.get('/:id', authenticate, wrap(getJob));

// Apply — students only (multipart: resume file)
router.post(
  '/:id/apply',
  authenticate,
  authorize('student'),
  resumeUpload.single('resume'),
  wrap(applyToJob)
);

// Coordinator/admin management
router.post('/', authenticate, authorize('coordinator', 'admin'), validate(jobSchema), wrap(createJob));
router.patch(
  '/:id',
  authenticate,
  authorize('coordinator', 'admin'),
  validate(updateJobSchema),
  wrap(updateJob)
);
router.delete('/:id', authenticate, authorize('coordinator', 'admin'), wrap(deleteJob));
router.get(
  '/:id/applicants',
  authenticate,
  authorize('coordinator', 'admin'),
  wrap(listApplicants)
);
router.post('/:id/remind', authenticate, authorize('coordinator', 'admin'), wrap(sendReminders));

export default router;
