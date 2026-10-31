import { Request, Response } from 'express';
import { sendSuccess, sendCreated, AppError } from '../../../core/utils/apiResponse';
import { UserRole } from '../../../types';
import { getAllRegistryItems, getRegistryItem } from '../registry';
import { importService } from '../services/import.service';
import { browserService } from '../services/browser.service';
import { exportService } from '../services/export.service';
import { backupService } from '../services/backup.service';
import { queryService } from '../services/query.service';
import { integrityService } from '../services/integrity.service';
import { toolsService } from '../services/tools.service';
import { overviewService } from '../services/overview.service';
import { dbWriteService, DbWriteContext } from '../services/dbWrite.service';
import DbJob from '../models/DbJob.model';

function getWriteContext(req: Request): DbWriteContext {
  return {
    actorId: req.user!.sub,
    actorRole: req.user!.role as UserRole,
    ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    reauthToken: req.headers['x-reauth-token'] as string | undefined,
  };
}

export class DatabaseController {
  // ── Overview & Jobs ──
  async getOverview(_req: Request, res: Response) {
    const stats = await overviewService.getOverviewStats();
    sendSuccess(res, stats);
  }

  async getJobs(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const type = req.query.type as string | undefined;
    const result = await overviewService.getJobHistory(page, limit, type);
    sendSuccess(res, result.jobs, 200, result.meta);
  }

  async getJob(req: Request, res: Response) {
    const job = await DbJob.findById(req.params.id).populate('createdBy', 'displayName email role');
    if (!job) throw new AppError('Job not found', 404, 'NOT_FOUND');
    sendSuccess(res, job);
  }

  async undoBatch(req: Request, res: Response) {
    const ctx = getWriteContext(req);
    const batchId = req.params.batchId || req.params.id;
    const result = await importService.undoBatch(batchId, ctx);
    sendSuccess(res, result);
  }

  // ── Registry ──
  async getRegistry(_req: Request, res: Response) {
    const items = getAllRegistryItems().map((r) => ({
      key: r.key,
      label: r.label,
      uniqueKey: r.uniqueKey,
      importable: r.importable,
      exportable: r.exportable,
      editable: r.editable,
      deletable: r.deletable,
      softDelete: r.softDelete,
      refs: r.refs,
      defaultColumns: r.defaultColumns,
      searchFields: r.searchFields,
      readRoles: r.readRoles,
      writeRoles: r.writeRoles,
      destructiveRoles: r.destructiveRoles,
    }));
    sendSuccess(res, items);
  }

  // ── Import ──
  async dryRunImport(req: Request, res: Response) {
    const ctx = getWriteContext(req);
    const payload = req.body.payload ?? req.body.bundle ?? req.body.data ?? req.body;
    const collection = req.body.collection ?? (req.body.bundle ? 'bundle' : undefined);
    const options = req.body.options ?? { mode: req.body.mode || 'insert_only' };
    const result = await importService.dryRun(payload, collection, ctx, options);
    sendSuccess(res, result);
  }

  async commitImport(req: Request, res: Response) {
    const ctx = getWriteContext(req);
    let dryRunResult = req.body.dryRunResult;
    const options = req.body.options ?? { mode: req.body.mode || 'insert_only' };
    if (!dryRunResult || !dryRunResult.summary) {
      const payload = req.body.payload ?? req.body.bundle ?? req.body.data ?? req.body;
      const collection = req.body.collection ?? (req.body.bundle ? 'bundle' : undefined);
      dryRunResult = await importService.dryRun(payload, collection, ctx, options);
    }
    const result: any = await importService.commitImport(dryRunResult, ctx, options);
    const responsePayload = {
      jobId: (result._id || result.id || '').toString(),
      batchId: result.batchId,
      status: result.status,
      counts: result.counts,
      ...(result.toObject ? result.toObject() : result),
    };
    sendSuccess(res, responsePayload, 200);
  }

  async loadStarterPack(_req: Request, res: Response) {
    const pack = await importService.loadStarterSeedPack();
    sendSuccess(res, pack);
  }

  async getImportTemplate(req: Request, res: Response) {
    const colKey = req.params.collection;
    const reg = getRegistryItem(colKey);
    if (!reg) throw new AppError(`Collection not found: ${colKey}`, 404, 'NOT_FOUND');

    let template: any = {};
    if (colKey === 'categories') {
      template = [{ name: 'Immunity Boosters', slug: 'immunity-boosters', description: 'Ayurvedic Rasayana herbs', sortOrder: 1 }];
    } else if (colKey === 'plants') {
      template = [{
        commonName: 'Tulsi',
        scientificName: 'Ocimum tenuiflorum',
        slug: 'tulsi',
        family: 'Lamiaceae',
        description: 'Sacred adaptogen herb',
        categories: ['ayurvedic-herbs'],
        medicinalUses: ['Immunity', 'Stress relief'],
        toxicityLevel: 'NONE',
        isPublished: true,
      }];
    } else if (colKey === 'remedies') {
      template = [{
        title: 'Golden Milk',
        slug: 'golden-milk',
        description: 'Turmeric infusion',
        plants: ['turmeric'],
        contraindications: ['Pregnancy in large doses'],
        isPublished: true,
      }];
    } else if (colKey === 'tours') {
      template = [{
        title: 'Immunity Garden Tour',
        slug: 'immunity-garden-tour',
        description: 'Walk through immunity herbs',
        stops: [{ order: 1, plant: 'tulsi', title: 'Tulsi Stop', description: 'Queen of herbs' }],
        isPublished: true,
      }];
    }

    sendSuccess(res, template);
  }

  async getAiPrompt(req: Request, res: Response) {
    const colKey = req.params.collection;
    const reg = getRegistryItem(colKey);
    if (!reg) throw new AppError(`Collection not found: ${colKey}`, 404, 'NOT_FOUND');

    const promptText = `You are a botanical and Ayurvedic taxonomist assistant for the Virtual Herbal Garden.
Generate a valid JSON array of documents for the "${reg.label}" collection (${colKey}).
Follow these strict rules:
1. Output ONLY valid JSON — no markdown code fences, no extra commentary.
2. Required fields: ${reg.defaultColumns.join(', ')}.
3. Unique identifier field is "${reg.uniqueKey}" (must be lowercase alphanumeric kebab-case).
4. If referencing other collections, use clean slugs like: "categories": ["ayurvedic-herbs"], "plants": ["tulsi"].
5. Always provide realistic medicinal uses, precautions, and botanical families.
Ensure all enum fields adhere strictly to:
- toxicityLevel: "NONE" | "LOW" | "MODERATE" | "HIGH"
- plantPart: "leaves" | "roots" | "bark" | "seeds" | "flowers"
- difficultyLevel: "EASY" | "MEDIUM" | "ADVANCED"`;

    sendSuccess(res, { prompt: promptText });
  }

  // ── Browse ──
  async browseCollection(req: Request, res: Response) {
    const colKey = req.params.collection as any;
    const { page, limit, sortField, sortOrder, search, filters } = req.query;

    let parsedFilters = [];
    if (typeof filters === 'string') {
      try { parsedFilters = JSON.parse(filters); } catch {}
    } else if (Array.isArray(filters)) {
      parsedFilters = filters;
    }

    const result = await browserService.browse(
      colKey,
      {
        page: Number(page),
        limit: Number(limit),
        sortField: sortField as string,
        sortOrder: sortOrder as any,
        search: search as string,
        filters: parsedFilters,
      },
      req.user!.role as UserRole
    );

    sendSuccess(res, result, 200, result.meta);
  }

  async getDocument(req: Request, res: Response) {
    const colKey = req.params.collection as any;
    const doc = await browserService.getByIdOrSlug(colKey, req.params.id, req.user!.role as UserRole);
    sendSuccess(res, doc);
  }

  async getBacklinks(req: Request, res: Response) {
    const colKey = req.params.collection as any;
    const backlinks = await browserService.getBacklinks(colKey, req.params.id);
    sendSuccess(res, backlinks);
  }

  async createDocument(req: Request, res: Response) {
    const ctx = getWriteContext(req);
    const colKey = req.params.collection as any;
    const doc = await dbWriteService.insertOne(colKey, req.body, ctx);
    sendCreated(res, doc);
  }

  async updateDocument(req: Request, res: Response) {
    const ctx = getWriteContext(req);
    const colKey = req.params.collection as any;
    const { updateData, data, expectedVersion = {}, expectedUpdatedAt } = req.body;
    const finalVersion = {
      ...expectedVersion,
      ...(expectedUpdatedAt ? { updatedAt: expectedUpdatedAt } : {}),
    };
    const finalData = updateData || data || req.body;
    const doc = await browserService.updateWithConcurrency(
      colKey,
      req.params.id,
      finalData,
      finalVersion,
      ctx
    );
    sendSuccess(res, doc);
  }

  async deleteDocument(req: Request, res: Response) {
    const ctx = getWriteContext(req);
    const colKey = req.params.collection as any;
    const doc = await dbWriteService.deleteOne(colKey, req.params.id, ctx);
    sendSuccess(res, doc);
  }

  async bulkAction(req: Request, res: Response) {
    const ctx = getWriteContext(req);
    const colKey = req.params.collection as any;
    const { docIds, action, payload } = req.body;
    const result = await browserService.bulkAction(colKey, docIds, action, payload, ctx);
    sendSuccess(res, result);
  }

  // ── Export ──
  async exportData(req: Request, res: Response) {
    const ctx = getWriteContext(req);
    const options: any = {
      collection: (req.params.collection || req.body.collection || req.query.collection) as any,
      format: (req.query.format || req.body.format || 'json') as any,
      seedFormat: req.query.seedFormat === 'true' || req.body.seedFormat === true,
      filter: req.body.filter,
    };
    await exportService.exportData(options, ctx, res);
  }

  // ── Backups ──
  async listBackups(_req: Request, res: Response) {
    const backups = await backupService.listBackups();
    sendSuccess(res, backups);
  }

  async createBackup(req: Request, res: Response) {
    const ctx = getWriteContext(req);
    const backup: any = await backupService.createBackup(req.body, ctx);
    sendCreated(res, {
      backupId: backup._id.toString(),
      id: backup._id.toString(),
      ...(backup.toObject ? backup.toObject() : backup),
    });
  }

  async dryRunRestore(req: Request, res: Response) {
    const ctx = getWriteContext(req);
    const result = await backupService.dryRunRestore(req.params.id, ctx);
    sendSuccess(res, result);
  }

  async restoreBackup(req: Request, res: Response) {
    const ctx = getWriteContext(req);
    const { mode = 'overwrite_matching' } = req.body;
    const result = await backupService.restoreBackup(req.params.id, mode, ctx);
    sendSuccess(res, result);
  }

  async deleteBackup(req: Request, res: Response) {
    const ctx = getWriteContext(req);
    const backup = await backupService.deleteBackup(req.params.id, ctx);
    sendSuccess(res, backup);
  }

  // ── Query Console ──
  async executeFind(req: Request, res: Response) {
    const result = await queryService.executeFind(req.body, req.user!.role as UserRole);
    sendSuccess(res, result);
  }

  async executeAggregate(req: Request, res: Response) {
    const result = await queryService.executeAggregate(req.body, req.user!.role as UserRole);
    sendSuccess(res, result);
  }

  async getQueryExamples(_req: Request, res: Response) {
    sendSuccess(res, queryService.getBuiltInQueries());
  }

  // ── Integrity ──
  async getIntegrityReport(_req: Request, res: Response) {
    const report = await integrityService.runCheck();
    sendSuccess(res, report);
  }

  async applyIntegrityFix(req: Request, res: Response) {
    const ctx = getWriteContext(req);
    const result = await integrityService.applyFix(req.body.issue, ctx);
    sendSuccess(res, result);
  }

  async ignoreIntegrityIssue(req: Request, res: Response) {
    const result = integrityService.ignoreIssue(req.body.issueId);
    sendSuccess(res, result);
  }

  // ── Tools ──
  async linkR2Assets(req: Request, res: Response) {
    const ctx = getWriteContext(req);
    const dryRun = req.body.dryRun !== false;
    const result = await toolsService.linkAssetsFromR2(ctx, dryRun);
    sendSuccess(res, result);
  }

  async getAssetCoverage(_req: Request, res: Response) {
    const report = await toolsService.getAssetCoverageReport();
    sendSuccess(res, report);
  }

  async autoPlace3D(req: Request, res: Response) {
    const ctx = getWriteContext(req);
    const dryRun = req.body.dryRun !== false;
    const result = await toolsService.autoPlace3DPositions(ctx, dryRun);
    sendSuccess(res, result);
  }

  async findAndReplace(req: Request, res: Response) {
    const ctx = getWriteContext(req);
    const { collection, field, findText, replaceText, dryRun = true } = req.body;
    const result = await toolsService.findAndReplace(collection, field, findText, replaceText, ctx, dryRun);
    sendSuccess(res, result);
  }

  async normalizeData(req: Request, res: Response) {
    const ctx = getWriteContext(req);
    const dryRun = req.body.dryRun !== false;
    const result = await toolsService.normalizeBotanicalData(ctx, dryRun);
    sendSuccess(res, result);
  }

  async getIndexes(_req: Request, res: Response) {
    const result = await toolsService.getIndexesReport();
    sendSuccess(res, result);
  }

  async syncIndexes(req: Request, res: Response) {
    const ctx = getWriteContext(req);
    const result = await toolsService.syncIndexes(ctx);
    sendSuccess(res, result);
  }
}

export const databaseController = new DatabaseController();
