import { Router } from 'express';
import { databaseController } from './controllers/database.controller';
import { authenticate } from '../../core/middleware/auth';
import { requireRole } from '../../core/middleware/rbac';
import { requireFeatureFlag } from '../../core/middleware/requireFeatureFlag';
import { requireRecentAuth } from '../../core/middleware/requireRecentAuth';
import { UserRole } from '../../types';

const router = Router();

// Base middleware stack: Authenticated + Min Role ADMIN + Feature Flag check
router.use(authenticate());
router.use(requireRole(UserRole.ADMIN));
router.use(requireFeatureFlag('database_manager'));

// ── Overview & Jobs ──
router.get('/overview', databaseController.getOverview);
router.get('/jobs', databaseController.getJobs);
router.get('/jobs/:id', databaseController.getJob);
router.post('/jobs/undo/:batchId', databaseController.undoBatch);
router.post('/jobs/:id/undo', databaseController.undoBatch);

// ── Registry ──
router.get('/registry', databaseController.getRegistry);
router.get('/collections', databaseController.getRegistry);

// ── Import ──
router.post('/import/dry-run', databaseController.dryRunImport);
router.post('/import/commit', databaseController.commitImport);
router.get('/import/starter-pack', databaseController.loadStarterPack);
router.get('/import/template/:collection', databaseController.getImportTemplate);
router.get('/import/ai-prompt/:collection', databaseController.getAiPrompt);

// ── Browser & Editor ──
router.get('/browse/:collection', databaseController.browseCollection);
router.get('/browse/:collection/:id', databaseController.getDocument);
router.get('/browse/:collection/:id/backlinks', databaseController.getBacklinks);
router.post('/browse/:collection', databaseController.createDocument);
router.patch('/browse/:collection/:id', databaseController.updateDocument);
router.put('/browse/:collection/:id', databaseController.updateDocument);
router.delete('/browse/:collection/:id', databaseController.deleteDocument);
router.post('/browse/:collection/bulk', databaseController.bulkAction);

// ── Export ──
router.get('/export/:collection', databaseController.exportData);
router.get('/export', databaseController.exportData);
router.post('/export', databaseController.exportData);

// ── Backups (SUPER_ADMIN only for mutate/restore) ──
router.get('/backups', databaseController.listBackups);
router.post('/backups', requireRole(UserRole.SUPER_ADMIN), databaseController.createBackup);
router.post(
  '/backups/:id/dry-run-restore',
  requireRole(UserRole.SUPER_ADMIN),
  databaseController.dryRunRestore
);
router.post(
  '/backups/:id/restore',
  requireRole(UserRole.SUPER_ADMIN),
  requireRecentAuth,
  databaseController.restoreBackup
);
router.delete(
  '/backups/:id',
  requireRole(UserRole.SUPER_ADMIN),
  databaseController.deleteBackup
);

// ── Query Console (Read-only) ──
router.post('/query/find', databaseController.executeFind);
router.post('/query/aggregate', databaseController.executeAggregate);
router.get('/query/examples', databaseController.getQueryExamples);

// ── Data Integrity ──
router.get('/integrity/report', databaseController.getIntegrityReport);
router.post('/integrity/fix', databaseController.applyIntegrityFix);
router.post('/integrity/ignore', databaseController.ignoreIntegrityIssue);

// ── Smart Tools ──
router.post('/tools/link-r2-assets', databaseController.linkR2Assets);
router.get('/tools/asset-coverage', databaseController.getAssetCoverage);
router.post('/tools/auto-place-3d', databaseController.autoPlace3D);
router.post('/tools/find-and-replace', databaseController.findAndReplace);
router.post('/tools/normalize', databaseController.normalizeData);
router.get('/tools/indexes', databaseController.getIndexes);
router.post(
  '/tools/sync-indexes',
  requireRole(UserRole.SUPER_ADMIN),
  requireRecentAuth,
  databaseController.syncIndexes
);

export default router;
