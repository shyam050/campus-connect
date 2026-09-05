import { Router } from 'express';
import { authenticate } from '../auth/jwt';
import {
  login,
  logout,
  me,
  refresh,
  register,
} from '../controllers/auth.controller';
import { authLimiter } from '../middleware/rateLimiter';
import { wrap } from '../middleware/async';
import { loginSchema, registerSchema } from '../validation/schemas';
import { validate } from '../middleware/validate';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), wrap(register));
router.post('/login', authLimiter, validate(loginSchema), wrap(login));
router.post('/refresh', wrap(refresh));
router.post('/logout', wrap(logout));
router.get('/me', authenticate, wrap(me));

export default router;
