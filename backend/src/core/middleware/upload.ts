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

const multipleMulter = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 10 },
  fileFilter,
}).fields([
  { name: 'images', maxCount: 10 },
  { name: 'image', maxCount: 10 },
]);

export const uploadMultiple = (req: any, res: any, next: any) => {
  multipleMulter(req, res, (err: any) => {
    if (err) return next(err);
    if (req.files && !Array.isArray(req.files)) {
      const filesObj = req.files as { [fieldname: string]: Express.Multer.File[] };
      const combined = [
        ...(filesObj['images'] || []),
        ...(filesObj['image'] || []),
      ];
      req.files = combined;
    }
    next();
  });
};

export const uploadGLB = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB per PRD §24.4
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === 'model/gltf-binary' ||
      file.mimetype === 'application/octet-stream' ||
      file.originalname.toLowerCase().endsWith('.glb')
    ) {
      cb(null, true);
    } else {
      cb(new AppError('Only .glb files are accepted', 400, 'INVALID_FILE_TYPE'));
    }
  },
});
