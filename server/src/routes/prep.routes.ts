import { Router } from 'express';
import { authenticate, authorize } from '../auth/jwt';
import {
  addSubtopic,
  createModule,
  deleteModule,
  deleteSubtopic,
  listModules,
  toggleSubtopic,
  updateModule,
} from '../controllers/prep.controller';
import {
  addSubtopicSchema,
  createModuleSchema,
  toggleSubtopicSchema,
  updateModuleSchema,
} from '../validation/schemas';
import { validate } from '../middleware/validate';
import { wrap } from '../middleware/async';

const router = Router();

// Prep tracker is student-scoped (coordinators/admins have no prep modules)
router.use(authenticate, authorize('student'));

router.get('/', wrap(listModules));
router.post('/', validate(createModuleSchema), wrap(createModule));
router.patch('/:id', validate(updateModuleSchema), wrap(updateModule));
router.delete('/:id', wrap(deleteModule));
router.post('/:id/subtopics', validate(addSubtopicSchema), wrap(addSubtopic));
// PATCH /api/v1/prep/:moduleId/subtopics/:subtopicIndex
router.patch(
  '/:moduleId/subtopics/:subtopicIndex',
  validate(toggleSubtopicSchema),
  wrap(toggleSubtopic)
);
router.delete('/:id/subtopics/:subtopicIndex', wrap(deleteSubtopic));

export default router;
