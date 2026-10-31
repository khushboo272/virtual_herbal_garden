import { getRegistryItem } from '../registry';
import { CollectionKey, QueryConsolePayload, AggregateConsolePayload } from '../types';
import { UserRole } from '../../../types';
import { AppError } from '../../../core/utils/apiResponse';
import { browserService } from './browser.service';

const ALLOWED_STAGES = new Set([
  '$match',
  '$group',
  '$project',
  '$sort',
  '$limit',
  '$skip',
  '$unwind',
  '$lookup',
  '$count',
  '$facet',
]);

const FORBIDDEN_TOKENS = ['$out', '$merge', '$function', '$accumulator', '$where'];

export const BUILT_IN_QUERIES = [
  {
    id: 'plants_no_images',
    name: 'Published Plants without Images',
    collection: 'plants' as CollectionKey,
    type: 'find',
    filter: { isPublished: true, 'images.0': { $exists: false } },
    projection: { commonName: 1, scientificName: 1, slug: 1, isPublished: 1 },
    sort: { commonName: 1 },
  },
  {
    id: 'remedies_no_contraindications',
    name: 'Remedies Missing Contraindications (Medical Alert)',
    collection: 'remedies' as CollectionKey,
    type: 'find',
    filter: { 'contraindications.0': { $exists: false } },
    projection: { title: 1, slug: 1, isPublished: 1 },
  },
  {
    id: 'plants_no_3d_placement',
    name: 'Plants Missing 3D Garden Placement',
    collection: 'plants' as CollectionKey,
    type: 'find',
    filter: { 'placement3d.position': { $exists: false } },
    projection: { commonName: 1, scientificName: 1, slug: 1 },
  },
  {
    id: 'remedies_per_plant',
    name: 'Plant Usage Count Across Remedies',
    collection: 'remedies' as CollectionKey,
    type: 'aggregate',
    pipeline: [
      { $unwind: '$plants' },
      { $group: { _id: '$plants', remedyCount: { $sum: 1 } } },
      { $sort: { remedyCount: -1 } },
      { $limit: 20 },
    ],
  },
  {
    id: 'top_bookmarked_entities',
    name: 'Top Bookmarked Items',
    collection: 'bookmarks' as CollectionKey,
    type: 'aggregate',
    pipeline: [
      { $group: { _id: { entityType: '$entityType', entityId: '$entityId' }, total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 25 },
    ],
  },
];

export class QueryService {
  /**
   * Validate aggregate pipeline safety
   */
  validatePipeline(pipeline: any[]): void {
    if (!Array.isArray(pipeline)) {
      throw new AppError('Pipeline must be an array of stages', 400, 'INVALID_PIPELINE');
    }

    const strRepr = JSON.stringify(pipeline);
    for (const token of FORBIDDEN_TOKENS) {
      if (strRepr.includes(`"${token}"`) || strRepr.includes(`'${token}'`)) {
        throw new AppError(`Disallowed aggregation stage: ${token}`, 400, 'FORBIDDEN_STAGE');
      }
    }

    for (const stage of pipeline) {
      if (typeof stage !== 'object' || stage === null) {
        throw new AppError('Each stage must be an object', 400, 'INVALID_STAGE');
      }

      const keys = Object.keys(stage);
      if (keys.length !== 1) {
        throw new AppError('Each stage must define exactly one operator', 400, 'INVALID_STAGE');
      }

      const op = keys[0];
      if (!ALLOWED_STAGES.has(op)) {
        throw new AppError(`Aggregation stage "${op}" is not allowed`, 403, 'FORBIDDEN_STAGE');
      }

      // Special check on $lookup: only allowlisted collections
      if (op === '$lookup') {
        const fromCol = stage[op]?.from;
        if (typeof fromCol === 'string') {
          const reg = getRegistryItem(fromCol);
          if (!reg) {
            throw new AppError(`Lookup from collection "${fromCol}" is not allowed`, 403, 'FORBIDDEN_LOOKUP');
          }
        }
      }
    }
  }

  /**
   * Execute read-only find query
   */
  async executeFind(payload: QueryConsolePayload, userRole: UserRole) {
    const reg = getRegistryItem(payload.collection);
    if (!reg) throw new AppError(`Collection not found: ${payload.collection}`, 404, 'NOT_FOUND');

    if (!reg.readRoles.includes(userRole)) {
      throw new AppError(`Access forbidden to query ${payload.collection}`, 403, 'FORBIDDEN');
    }

    const filter = payload.filter || {};
    const projection = payload.projection || {};
    const sort = payload.sort || { _id: -1 };
    const limit = Math.min(1000, Math.max(1, payload.limit || 50));
    const skip = Math.max(0, payload.skip || 0);

    const query = reg.model
      .find(filter, projection)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .maxTimeMS(10000)
      .lean();

    if (payload.explain) {
      return (query as any).explain('executionStats');
    }

    const startTime = Date.now();
    const results = await query;
    const durationMs = Date.now() - startTime;

    const sanitized = results.map((d: any) => browserService.redactDoc(d, reg.redactFields));

    return {
      results: sanitized,
      count: sanitized.length,
      durationMs,
    };
  }

  /**
   * Execute read-only aggregate query
   */
  async executeAggregate(payload: AggregateConsolePayload, userRole: UserRole) {
    const reg = getRegistryItem(payload.collection);
    if (!reg) throw new AppError(`Collection not found: ${payload.collection}`, 404, 'NOT_FOUND');

    if (!reg.readRoles.includes(userRole)) {
      throw new AppError(`Access forbidden to query ${payload.collection}`, 403, 'FORBIDDEN');
    }

    this.validatePipeline(payload.pipeline);

    const startTime = Date.now();
    const results = await reg.model
      .aggregate(payload.pipeline as any)
      .option({ maxTimeMS: 10000 })
      .exec();
    const durationMs = Date.now() - startTime;

    const sanitized = results.map((d: any) => browserService.redactDoc(d, reg.redactFields));

    return {
      results: sanitized,
      count: sanitized.length,
      durationMs,
    };
  }

  /**
   * Return built-in query examples
   */
  getBuiltInQueries() {
    return BUILT_IN_QUERIES;
  }
}

export const queryService = new QueryService();
