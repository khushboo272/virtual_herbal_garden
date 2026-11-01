import { Router, Request, Response, NextFunction } from 'express';
import { storageController } from './storage.controller';
import { authenticate } from '../../core/middleware/auth';
import { requireRole } from '../../core/middleware/rbac';
import { requireFeatureFlag } from '../../core/middleware/requireFeatureFlag';
import { requireRecentAuth } from '../../core/middleware/requireRecentAuth';
import { UserRole } from '../../types';

const router = Router();

// Base middleware stack: Authenticated + Min Role ADMIN + Feature Flag check
router.use(authenticate());
router.use(requireRole(UserRole.ADMIN));
router.use(requireFeatureFlag('storage_manager'));

// Middleware that conditionally enforces reauth only when permanent is true
const conditionalReauth = (req: Request, res: Response, next: NextFunction) => {
  if (req.body?.permanent) {
    return requireRecentAuth(req, res, next);
  }
  next();
};

// ── File & Folder Navigation ──
router.get('/list', storageController.list);
router.get('/stat', storageController.stat);
router.get('/info', storageController.getBucketInfo);
router.post('/create-folder', storageController.createFolder);

// ── Upload & Download ──
router.post('/presign-upload', storageController.presignUpload);
router.get('/presign-download', storageController.presignDownload);
router.post('/download-zip', storageController.downloadZip);

// ── Mutations ──
router.post('/copy', storageController.copy);
router.post('/move', storageController.move);
router.post('/delete', conditionalReauth, storageController.delete);
router.post('/delete-many', conditionalReauth, storageController.deleteMany);
router.post('/delete-prefix', requireRecentAuth, storageController.deletePrefix);
router.patch('/metadata', storageController.updateMetadata);

// ── Trash & Safety Net ──
router.get('/trash', storageController.listTrash);
router.post('/trash/restore', storageController.restoreTrash);
router.post('/trash/empty', requireRecentAuth, storageController.emptyTrash);

// ── Smart Storage Tools ──
router.get('/sync-check', storageController.syncCheck);
router.get('/coverage', storageController.coverageReport);

export default router;

