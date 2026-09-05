import { Router } from 'express';
import { authenticate, authorize } from '../auth/jwt';
import {
  listApplications,
  myApplications,
  updateStatus,
  withdrawApplication,
} from '../controllers/application.controller';
import {
  applicationStatusSchema,
  listApplicationsQuerySchema,
} from '../validation/schemas';
import { validate } from '../middleware/validate';
import { wrap } from '../middleware/async';

const router = Router();

// Student: own applications
router.get('/me', authenticate, authorize('student'), wrap(myApplications));

// Coordinator/admin: all applications
router.get(
  '/',
  authenticate,
  authorize('coordinator', 'admin'),
  validate(listApplicationsQuerySchema, 'query'),
  wrap(listApplications)
);

router.patch(
  '/:id/status',
  authenticate,
  authorize('coordinator', 'admin'),
  validate(applicationStatusSchema),
  wrap(updateStatus)
);

router.delete('/:id', authenticate, wrap(withdrawApplication));

export default router;
