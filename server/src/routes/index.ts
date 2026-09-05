import { Router } from 'express';
import authRoutes from './auth.routes';
import jobRoutes from './job.routes';
import applicationRoutes from './application.routes';
import prepRoutes from './prep.routes';
import adminRoutes from './admin.routes';
import profileRoutes from './profile.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);
router.use('/prep', prepRoutes);
router.use('/admin', adminRoutes);
router.use('/profile', profileRoutes);

export default router;
