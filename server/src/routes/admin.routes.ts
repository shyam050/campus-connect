import { Router } from 'express';
import { authenticate, authorize } from '../auth/jwt';
import {
  analytics,
  bulkVerify,
  deleteUser,
  listUsers,
  moderationApplications,
  moderationJobs,
  updateUser,
} from '../controllers/admin.controller';
import {
  bulkVerifySchema,
  listUsersQuerySchema,
  updateUserSchema,
} from '../validation/schemas';
import { validate } from '../middleware/validate';
import { wrap } from '../middleware/async';

const router = Router();

// Everything under /admin is admin-only
router.use(authenticate, authorize('admin'));

router.get('/analytics', wrap(analytics));

router.get('/users', validate(listUsersQuerySchema, 'query'), wrap(listUsers));
router.patch('/users/:id', validate(updateUserSchema), wrap(updateUser));
router.delete('/users/:id', wrap(deleteUser));
router.post('/users/bulk-verify', validate(bulkVerifySchema), wrap(bulkVerify));

router.get('/moderation/jobs', wrap(moderationJobs));
router.get('/moderation/applications', wrap(moderationApplications));

export default router;
