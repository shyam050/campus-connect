import multer from 'multer';
import { RESUME_MAX_BYTES, RESUME_MIME_TYPES } from '../types/constants';
import { ApiError } from './error';

export const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: RESUME_MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (RESUME_MIME_TYPES.includes(file.mimetype)) return cb(null, true);
    cb(new ApiError(422, 'VALIDATION_ERROR', 'Resume must be a PDF or Word document'));
  },
});
