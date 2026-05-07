import multer from 'multer';
import { AppError } from '../utils/apiResponse';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per PRD §8.3

const storage = multer.memoryStorage();

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('File type not allowed. Accepted: JPEG, PNG, WebP, HEIC', 400, 'INVALID_FILE_TYPE'));
  }
};

export const uploadSingle = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
}).single('image');

export const uploadMultiple = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 10 },
  fileFilter,
}).array('images', 10);
