import fs from 'fs';
import path from 'path';
import { Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../../core/utils/apiResponse';
import { UserRole } from '../../../types';
import { getRegistryItem, isContentCollection } from '../registry';
import { CollectionKey, ImportMode, ImportStatusOverride, DbJobError } from '../types';
import DbJob from '../models/DbJob.model';
import { seedAdapter, SeedBundleInput } from '../adapters/seedAdapter';
import { dbWriteService, DbWriteContext } from './dbWrite.service';

export interface DryRunRowResult {
  row: number;
  collectionName: CollectionKey;
  uniqueValue: string;
  action: 'insert' | 'update' | 'skip' | 'error';
  warnings: string[];
  errors: string[];
  diff?: Record<string, { before: any; after: any }>;
  docData: any;
}

export interface DryRunResult {
  batchId: string;
  isBundle: boolean;
  collections: CollectionKey[];
  willInsert?: number;
  willUpdate?: number;
  willSkip?: number;
  errorCount?: number;
  summary: {
    willInsert: number;
    willUpdate: number;
    willSkip: number;
    errorsCount: number;
    total: number;
  };
  rows: DryRunRowResult[];
  errors: DbJobError[];
}

export interface ImportOptions {
  mode?: ImportMode;
  format?: 'seed_v1' | 'raw';
  statusOverride?: ImportStatusOverride;
  stripUnknownFields?: boolean;
}

export class ImportService {
  /**
   * Reject keys starting with $ or containing . (prevent NoSQL injection & prototype pollution)
   */
  sanitizeKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      if (typeof obj === 'string') {
        // Strip malicious HTML tags
        return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim();
      }
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeKeys(item));
    }

    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('$') || key.includes('.')) {
        throw new AppError(`Illegal key detected in import payload: "${key}"`, 400, 'ILLEGAL_KEY');
      }
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        throw new AppError('Prototype pollution attempt detected', 400, 'ILLEGAL_KEY');
      }
      clean[key] = this.sanitizeKeys(value);
    }
    return clean;
  }

  /**
   * Auto-detect target collection from document shape
   */
  detectCollection(data: any): CollectionKey | 'bundle' | null {
    if (typeof data !== 'object' || data === null) return null;

    if (!Array.isArray(data)) {
      const keys = Object.keys(data);
      if (keys.some((k) => ['categories', 'plants', 'remedies', 'tours'].includes(k))) {
        return 'bundle';
      }
    }

    const sample = Array.isArray(data) ? data[0] : data;
    if (!sample || typeof sample !== 'object') return null;

    if ('scientificName' in sample || 'botanicalFamily' in sample || 'ayurvedicNames' in sample) {
      return 'plants';
    }
    if ('ingredients' in sample || 'preparationSteps' in sample || 'contraindications' in sample) {
      return 'remedies';
    }
    if ('stops' in sample || 'checkpoints' in sample || 'estimatedDuration' in sample) {
      return 'tours';
    }
    if ('sortOrder' in sample && 'name' in sample && !('commonName' in sample)) {
      return 'categories';
    }
    return null;
  }

  /**
   * Resolve plant & category maps across Database and current import batch
   */
  async buildReferenceResolvers(bundle: SeedBundleInput): Promise<{
    categoryIdMap: Map<string, Types.ObjectId>;
    plantIdMap: Map<string, Types.ObjectId>;
    plantSlugMap: Map<string, string>;
  }> {
    const categoryIdMap = new Map<string, Types.ObjectId>();
    const plantIdMap = new Map<string, Types.ObjectId>();
    const plantSlugMap = new Map<string, string>();

    // 1. Load existing from DB
    const CategoryModel = getRegistryItem('categories')!.model;
    const PlantModel = getRegistryItem('plants')!.model;

    const existingCats = await CategoryModel.find({}, '_id slug').lean();
    for (const cat of existingCats) {
      categoryIdMap.set((cat.slug as string).toLowerCase(), cat._id as Types.ObjectId);
    }

    const existingPlants = await PlantModel.find({}, '_id slug').lean();
    for (const p of existingPlants) {
      plantIdMap.set((p.slug as string).toLowerCase(), p._id as Types.ObjectId);
      plantSlugMap.set((p.slug as string).toLowerCase(), p.slug as string);
    }

    // 2. Add from current batch
    if (Array.isArray(bundle?.categories)) {
      for (const cat of bundle.categories) {
        if (cat && cat.slug) {
          const id = seedAdapter.normalizeId(cat._id);
          categoryIdMap.set(cat.slug.toLowerCase().trim(), id);
        }
      }
    }

    if (Array.isArray(bundle?.plants)) {
      for (const p of bundle.plants) {
        if (p && p.slug) {
          const id = seedAdapter.normalizeId(p._id);
          plantIdMap.set(p.slug.toLowerCase().trim(), id);
          plantSlugMap.set(p.slug.toLowerCase().trim(), p.slug.trim());
        }
      }
    }

    return { categoryIdMap, plantIdMap, plantSlugMap };
  }

  /**
   * Build query matching existing document by _id, primary uniqueKey, or alternateUniqueKeys
   */
  buildExistingDocQuery(data: any, reg: any): any {
    const orConditions: any[] = [];
    if (data._id && Types.ObjectId.isValid(data._id)) {
      orConditions.push({ _id: data._id });
    }
    if (data[reg.uniqueKey]) {
      orConditions.push({ [reg.uniqueKey]: data[reg.uniqueKey] });
    }
    if (Array.isArray(reg.alternateUniqueKeys)) {
      for (const altKey of reg.alternateUniqueKeys) {
        if (data[altKey]) {
          orConditions.push({ [altKey]: data[altKey] });
        }
      }
    }
    return orConditions.length > 1 ? { $or: orConditions } : (orConditions[0] || {});
  }

  /**
   * Execute Dry Run validation without persisting changes
   */
  async dryRun(
    payload: any,
    targetCollection: CollectionKey | 'bundle' | undefined,
    ctx: DbWriteContext,
    options: ImportOptions = {}
  ): Promise<DryRunResult> {
    const mode: ImportMode = options.mode || 'insert_only';
    const batchId = uuidv4();

    // Verify sanitize
    const sanitized = this.sanitizeKeys(payload);

    let bundle: SeedBundleInput = {};
    const isBundle = targetCollection === 'bundle' || (!targetCollection && this.detectCollection(sanitized) === 'bundle');

    if (isBundle) {
      bundle = sanitized as SeedBundleInput;
    } else {
      const col = targetCollection || this.detectCollection(sanitized) || 'plants';
      bundle = { [col]: Array.isArray(sanitized) ? sanitized : [sanitized] };
    }

    // Dependency execution order: categories -> plants -> plants_extra -> remedies -> tours
    const collectionOrder: CollectionKey[] = ['categories', 'plants', 'remedies', 'tours'];
    const activeCollections = collectionOrder.filter((k) => Array.isArray(bundle[k]) && bundle[k].length > 0);

    // Merge plants_extra into plants if present
    if (Array.isArray(bundle.plants) && Array.isArray(bundle.plants_extra)) {
      bundle.plants = seedAdapter.mergePlantsExtra(bundle.plants, bundle.plants_extra);
    }

    // Build reference maps
    const { categoryIdMap, plantIdMap, plantSlugMap } = await this.buildReferenceResolvers(bundle);

    const rows: DryRunRowResult[] = [];
    const errors: DbJobError[] = [];
    let willInsert = 0;
    let willUpdate = 0;
    let willSkip = 0;

    let overallRowNumber = 1;

    for (const colKey of activeCollections) {
      const reg = getRegistryItem(colKey)!;
      const items = bundle[colKey] || [];
      const seenSlugsInFile = new Set<string>();

      for (let i = 0; i < items.length; i++) {
        const rawItem = items[i];
        const rowNum = overallRowNumber++;
        const rowErrors: string[] = [];
        const rowWarnings: string[] = [];

        // Check ADMIN permission on non-content collections
        if (ctx.actorRole === UserRole.ADMIN && !isContentCollection(colKey)) {
          rowErrors.push(`Admins are not allowed to import into ${colKey}`);
        }

        // Adapt seed format v1 if requested or auto-adapting
        let adapted = rawItem;
        if (options.format !== 'raw') {
          if (colKey === 'categories') adapted = seedAdapter.adaptCategory(rawItem, ctx.actorId);
          else if (colKey === 'plants') adapted = seedAdapter.adaptPlant(rawItem, ctx.actorId, categoryIdMap);
          else if (colKey === 'remedies') adapted = seedAdapter.adaptRemedy(rawItem, ctx.actorId, plantIdMap);
          else if (colKey === 'tours') adapted = seedAdapter.adaptTour(rawItem, ctx.actorId, plantIdMap, plantSlugMap);
        }

        // Apply status override if selected
        if (options.statusOverride && options.statusOverride !== 'keep' && 'isPublished' in adapted) {
          adapted.isPublished = options.statusOverride === 'PUBLISHED';
        }

        // Medical safety warning
        if (colKey === 'remedies') {
          if (!adapted.contraindications || adapted.contraindications.length === 0) {
            rowWarnings.push('Medical Safety Warning: Remedy has no listed contraindications');
          }
        }

        const uniqueVal = String(adapted[reg.uniqueKey] || adapted._id || `row-${rowNum}`).toLowerCase().trim();

        // Check duplicate within the same file
        if (seenSlugsInFile.has(uniqueVal)) {
          rowErrors.push(`Duplicate ${reg.uniqueKey} "${uniqueVal}" detected within this import payload`);
        }
        seenSlugsInFile.add(uniqueVal);

        // Zod validation
        if (reg.zodSchema) {
          const zodRes = reg.zodSchema.safeParse(adapted);
          if (!zodRes.success) {
            for (const issue of zodRes.error.issues) {
              rowErrors.push(`${issue.path.join('.')}: ${issue.message}`);
            }
          }
        }

        // Existing document check in database
        const query = this.buildExistingDocQuery(adapted, reg);
        const existingDoc = await reg.model.findOne(query).lean();

        let action: 'insert' | 'update' | 'skip' | 'error' = 'insert';
        let diff: Record<string, { before: any; after: any }> | undefined = undefined;

        if (rowErrors.length > 0) {
          action = 'error';
        } else if (existingDoc) {
          const existingDocAny = existingDoc as any;
          if (existingDocAny[reg.uniqueKey] && adapted[reg.uniqueKey] && existingDocAny[reg.uniqueKey] !== adapted[reg.uniqueKey]) {
            rowWarnings.push(
              `Matched existing record by alternate key "${existingDocAny.scientificName || existingDocAny._id}" (existing slug: "${existingDocAny.slug}")`
            );
          }
          if (mode === 'insert_only') {
            action = 'skip';
            willSkip++;
          } else if (mode === 'upsert' || mode === 'update_merge' || mode === 'replace') {
            action = 'update';
            willUpdate++;

            // Compute field diff
            diff = {};
            for (const [k, v] of Object.entries(adapted)) {
              if (k === '_id' || k === '__v') continue;
              const beforeVal = (existingDoc as any)[k];
              if (JSON.stringify(beforeVal) !== JSON.stringify(v)) {
                diff[k] = { before: beforeVal, after: v };
              }
            }
          }
        } else {
          action = 'insert';
          willInsert++;
        }

        if (rowErrors.length > 0) {
          for (const msg of rowErrors) {
            errors.push({
              row: rowNum,
              collectionName: colKey,
              slug: uniqueVal,
              message: msg,
            });
          }
        }

        rows.push({
          row: rowNum,
          collectionName: colKey,
          uniqueValue: uniqueVal,
          action,
          warnings: rowWarnings,
          errors: rowErrors,
          diff,
          docData: adapted,
        });
      }
    }

    return {
      batchId,
      isBundle,
      collections: activeCollections,
      willInsert,
      willUpdate,
      willSkip,
      errorCount: errors.length,
      summary: {
        willInsert,
        willUpdate,
        willSkip,
        errorsCount: errors.length,
        total: rows.length,
      },
      rows,
      errors,
    };
  }

  /**
   * Commit verified dry run import batch into database with snapshotting for undo
   */
  async commitImport(
    dryRunResult: DryRunResult,
    ctx: DbWriteContext,
    options: ImportOptions = {}
  ): Promise<any> {
    if (dryRunResult.summary.errorsCount > 0) {
      throw new AppError(
        `Cannot commit import with ${dryRunResult.summary.errorsCount} validation errors. Fix errors first.`,
        400,
        'IMPORT_HAS_ERRORS'
      );
    }

    const mode = options.mode || 'insert_only';

    // Replace mode requires SUPER_ADMIN
    if (mode === 'replace' && ctx.actorRole !== UserRole.SUPER_ADMIN) {
      throw new AppError('Full replace mode requires SUPER_ADMIN role', 403, 'FORBIDDEN');
    }

    // Create DbJob record
    const job = await DbJob.create({
      type: 'import',
      status: 'running',
      batchId: dryRunResult.batchId,
      progress: { current: 0, total: dryRunResult.rows.length, percent: 0, message: 'Starting import...' },
      counts: {
        inserted: 0,
        updated: 0,
        skipped: 0,
        deleted: 0,
        errors: 0,
        total: dryRunResult.rows.length,
      },
      meta: {
        mode,
        isBundle: dryRunResult.isBundle,
        collections: dryRunResult.collections,
      },
      createdBy: new Types.ObjectId(ctx.actorId),
    });

    const insertedIds: { collection: CollectionKey; id: Types.ObjectId }[] = [];
    const preImageSnapshots: { collection: CollectionKey; id: Types.ObjectId; snapshot: any }[] = [];

    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    try {
      // Chunk processing (200 docs per chunk)
      const chunkSize = 200;
      for (let i = 0; i < dryRunResult.rows.length; i += chunkSize) {
        const chunk = dryRunResult.rows.slice(i, i + chunkSize);

        for (const row of chunk) {
          if (row.action === 'skip') {
            skippedCount++;
            continue;
          }

          const reg = getRegistryItem(row.collectionName)!;
          const docData = { ...row.docData, importBatchId: dryRunResult.batchId };

          if (row.action === 'insert') {
            try {
              const doc = new reg.model(docData);
              await doc.save();
              insertedIds.push({ collection: row.collectionName, id: doc._id as Types.ObjectId });
              insertedCount++;

              await dbWriteService.logAudit(
                row.collectionName,
                'IMPORT_INSERT',
                doc._id as Types.ObjectId,
                null,
                doc.toObject(),
                ctx,
                { batchId: dryRunResult.batchId }
              );
            } catch (err: any) {
              if (err.code === 11000) {
                // When duplicate key collision occurs, update the existing record
                const query = err.keyValue && Object.keys(err.keyValue).length > 0
                  ? err.keyValue
                  : this.buildExistingDocQuery(docData, reg);

                const existingDoc = await reg.model.findOne(query);
                if (existingDoc) {
                  preImageSnapshots.push({
                    collection: row.collectionName,
                    id: existingDoc._id as Types.ObjectId,
                    snapshot: existingDoc.toObject ? existingDoc.toObject() : existingDoc,
                  });

                  const { _id, ...fieldsToUpdate } = docData;
                  Object.assign(existingDoc, fieldsToUpdate);
                  await existingDoc.save();
                  updatedCount++;

                  await dbWriteService.logAudit(
                    row.collectionName,
                    'IMPORT_UPDATE',
                    existingDoc._id as Types.ObjectId,
                    existingDoc.toObject ? existingDoc.toObject() : existingDoc,
                    docData,
                    ctx,
                    { batchId: dryRunResult.batchId }
                  );
                  continue;
                }

                const dupField = err.keyPattern ? Object.keys(err.keyPattern).join(', ') : 'unique key';
                const dupVal = err.keyValue ? JSON.stringify(err.keyValue) : '';
                throw new AppError(
                  `Duplicate key collision on ${dupField} ${dupVal} in ${row.collectionName}. An existing record already has this unique value.`,
                  409,
                  'DUPLICATE_KEY'
                );
              }
              throw err;
            }
          } else if (row.action === 'update') {
            const query = this.buildExistingDocQuery(docData, reg);

            const oldDoc = await reg.model.findOne(query).lean();
            if (oldDoc) {
              preImageSnapshots.push({
                collection: row.collectionName,
                id: (oldDoc as any)._id as Types.ObjectId,
                snapshot: oldDoc,
              });

              // Exclude immutable _id, __v, and createdAt from update payload
              const { _id, __v, createdAt, ...fieldsToUpdate } = docData;
              const updatePayload = { $set: fieldsToUpdate };

              const updatedDoc = await reg.model.findOneAndUpdate(
                { _id: (oldDoc as any)._id },
                updatePayload,
                { new: true }
              );
              updatedCount++;

              await dbWriteService.logAudit(
                row.collectionName,
                'IMPORT_UPDATE',
                (oldDoc as any)._id as Types.ObjectId,
                oldDoc,
                updatedDoc?.toObject(),
                ctx,
                { batchId: dryRunResult.batchId }
              );
            }
          }

          // Update progress
          const currentProgress = insertedCount + updatedCount + skippedCount;
          job.progress = {
            current: currentProgress,
            total: dryRunResult.rows.length,
            percent: Math.round((currentProgress / dryRunResult.rows.length) * 100),
            message: `Processed ${currentProgress}/${dryRunResult.rows.length} records`,
          };
          job.counts = {
            inserted: insertedCount,
            updated: updatedCount,
            skipped: skippedCount,
            deleted: 0,
            errors: 0,
            total: dryRunResult.rows.length,
          };
        }
      }

      job.status = 'done';
      job.counts = {
        inserted: insertedCount,
        updated: updatedCount,
        skipped: skippedCount,
        deleted: 0,
        errors: 0,
        total: dryRunResult.rows.length,
      };
      job.snapshotData = { insertedIds, preImageSnapshots };
      await job.save();

      return job;
    } catch (err: any) {
      // Compensating rollback on failure
      job.status = 'failed';
      job.errors.push({ message: `Import failed: ${err.message}. Rolling back inserted documents.` });
      await job.save();

      for (const item of insertedIds) {
        try {
          const reg = getRegistryItem(item.collection);
          if (reg) await reg.model.deleteOne({ _id: item.id });
        } catch {}
      }

      throw new AppError(`Import failed and was rolled back: ${err.message}`, 500, 'IMPORT_FAILED');
    }
  }

  /**
   * Undo import batch: deletes inserted docs, restores pre-image for updated docs
   */
  async undoBatch(batchIdOrJobId: string, ctx: DbWriteContext): Promise<{ undoneInserted: number; restoredUpdated: number }> {
    const job = await DbJob.findOne({
      $or: [
        { batchId: batchIdOrJobId },
        ...(Types.ObjectId.isValid(batchIdOrJobId) ? [{ _id: batchIdOrJobId }] : []),
      ],
      type: 'import',
    });
    if (!job) {
      throw new AppError(`Import job with batchId or ID "${batchIdOrJobId}" not found`, 404, 'NOT_FOUND');
    }

    if (job.isUndone) {
      throw new AppError('This batch has already been undone', 400, 'ALREADY_UNDONE');
    }

    const { insertedIds = [], preImageSnapshots = [] } = job.snapshotData || {};

    let undoneInserted = 0;
    let restoredUpdated = 0;

    // 1. Remove inserted documents
    for (const item of insertedIds) {
      const reg = getRegistryItem(item.collection);
      if (reg) {
        await reg.model.deleteOne({ _id: item.id });
        undoneInserted++;
      }
    }

    // 2. Restore updated pre-images
    for (const item of preImageSnapshots) {
      const reg = getRegistryItem(item.collection);
      if (reg && item.snapshot) {
        await reg.model.replaceOne({ _id: item.id }, item.snapshot);
        restoredUpdated++;
      }
    }

    job.isUndone = true;
    job.undoneAt = new Date();
    await job.save();

    await dbWriteService.logAudit(
      (job.collectionName as CollectionKey) || 'plants',
      'IMPORT_UNDO',
      job._id as Types.ObjectId,
      null,
      { batchId: job.batchId, undoneInserted, restoredUpdated },
      ctx
    );

    return { undoneInserted, restoredUpdated };
  }

  /**
   * Load bundled seed pack from backend/seed-data/
   */
  async loadStarterSeedPack(): Promise<SeedBundleInput> {
    const seedDir = path.resolve(process.cwd(), 'seed-data');
    const bundle: SeedBundleInput = {};

    const files = ['categories.json', 'plants.json', 'plants_extra.json', 'remedies.json', 'tours.json'];
    for (const f of files) {
      const p = path.join(seedDir, f);
      const key = f.replace('.json', '');
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        bundle[key] = JSON.parse(raw);
      }
    }
    return bundle;
  }
}

export const importService = new ImportService();
