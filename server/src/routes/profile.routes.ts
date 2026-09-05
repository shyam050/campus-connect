import { Router } from 'express';
import { authenticate } from '../auth/jwt';
import { changePassword, updateProfile } from '../controllers/profile.controller';
import { changePasswordSchema, updateProfileSchema } from '../validation/schemas';
import { validate } from '../middleware/validate';
import { wrap } from '../middleware/async';

const router = Router();

router.use(authenticate);

router.patch('/', validate(updateProfileSchema), wrap(updateProfile));
router.post('/change-password', validate(changePasswordSchema), wrap(changePassword));

export default router;
