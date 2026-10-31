import zlib from 'zlib';
import { Response } from 'express';
import { Types } from 'mongoose';
import { getRegistryItem } from '../registry';
import { CollectionKey } from '../types';
import { UserRole } from '../../../types';
import { AppError } from '../../../core/utils/apiResponse';
import { browserService } from './browser.service';
import { dbWriteService, DbWriteContext } from './dbWrite.service';

export interface ExportOptions {
  collection?: CollectionKey | 'bundle';
  ids?: string[];
  filter?: Record<string, any>;
  format?: 'json' | 'ndjson' | 'csv' | 'gzip';
  seedFormat?: boolean;
}

export class ExportService {
  /**
   * Flatten nested objects and array to CSV string
   */
  toCsv(docs: any[]): string {
    if (!docs || docs.length === 0) return '';

    // Collect all field keys
    const headersSet = new Set<string>();
    for (const d of docs) {
      for (const k of Object.keys(d)) {
        headersSet.add(k);
      }
    }
    const headers = Array.from(headersSet);

    const escapeCsv = (val: any): string => {
      if (val === null || val === undefined) return '';
      if (Array.isArray(val)) {
        return `"${val.map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item))).join('|').replace(/"/g, '""')}"`;
      }
      if (typeof val === 'object') {
        return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      }
      const s = String(val);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const headerLine = headers.join(',');
    const rows = docs.map((d) => headers.map((h) => escapeCsv(d[h])).join(','));
    return [headerLine, ...rows].join('\n');
  }

  /**
   * Export single collection or Full Bundle
   */
  async exportData(options: ExportOptions, ctx: DbWriteContext, res: Response) {
    const format = options.format || 'json';
    const isBundle = options.collection === 'bundle' || !options.collection;

    if (isBundle) {
      if (ctx.actorRole !== UserRole.SUPER_ADMIN && ctx.actorRole !== UserRole.ADMIN) {
        throw new AppError('Unauthorized to export database bundle', 403, 'FORBIDDEN');
      }

      // Content bundle
      const bundleKeys: CollectionKey[] = ['categories', 'plants', 'remedies', 'tours'];
      const bundleData: Record<string, any[]> = {};

      for (const key of bundleKeys) {
        const reg = getRegistryItem(key)!;
        const docs = await reg.model.find({}).lean();
        bundleData[key] = docs.map((d) => browserService.redactDoc(d, reg.redactFields));
      }

      await dbWriteService.logAudit(
        'plants',
        'EXPORT_BUNDLE',
        null,
        null,
        { format, collections: bundleKeys },
        ctx
      );

      const jsonStr = JSON.stringify(bundleData, null, 2);

      if (format === 'gzip') {
        res.setHeader('Content-Type', 'application/gzip');
        res.setHeader('Content-Disposition', 'attachment; filename="database-bundle.json.gz"');
        const gzipped = zlib.gzipSync(Buffer.from(jsonStr, 'utf-8'));
        return res.send(gzipped);
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="database-bundle.json"');
      return res.send(jsonStr);
    }

    const colKey = options.collection as CollectionKey;
    const reg = getRegistryItem(colKey);
    if (!reg) throw new AppError(`Collection not found: ${colKey}`, 404, 'NOT_FOUND');

    if (!reg.readRoles.includes(ctx.actorRole)) {
      throw new AppError(`Access forbidden to export ${colKey}`, 403, 'FORBIDDEN');
    }

    const query: Record<string, any> = options.filter || {};
    if (options.ids && options.ids.length > 0) {
      query._id = { $in: options.ids.map((id) => new Types.ObjectId(id)) };
    }

    const docs = await reg.model.find(query).lean();
    const cleanDocs = docs.map((d) => browserService.redactDoc(d, reg.redactFields));

    await dbWriteService.logAudit(
      colKey,
      'EXPORT',
      null,
      null,
      { format, count: cleanDocs.length },
      ctx
    );

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${colKey}.csv"`);
      return res.send(this.toCsv(cleanDocs));
    }

    if (format === 'ndjson') {
      res.setHeader('Content-Type', 'application/x-ndjson');
      res.setHeader('Content-Disposition', `attachment; filename="${colKey}.ndjson"`);
      const ndjson = cleanDocs.map((d) => JSON.stringify(d)).join('\n');
      return res.send(ndjson);
    }

    const jsonStr = JSON.stringify(cleanDocs, null, 2);

    if (format === 'gzip') {
      res.setHeader('Content-Type', 'application/gzip');
      res.setHeader('Content-Disposition', `attachment; filename="${colKey}.json.gz"`);
      const gzipped = zlib.gzipSync(Buffer.from(jsonStr, 'utf-8'));
      return res.send(gzipped);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${colKey}.json"`);
    return res.send(jsonStr);
  }
}

export const exportService = new ExportService();
