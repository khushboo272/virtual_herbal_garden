import { Types } from 'mongoose';
import Plant from '../../library/Plant.model';
import Tour from '../../tours/Tour.model';
import { getRegistryItem, getAllRegistryItems } from '../registry';
import { CollectionKey } from '../types';
import { AppError } from '../../../core/utils/apiResponse';
import { dbWriteService, DbWriteContext } from './dbWrite.service';

export class ToolsService {
  /**
   * Link R2 assets by slug matching
   */
  async linkAssetsFromR2(ctx: DbWriteContext, dryRun = true) {
    const plants = await Plant.find({}).lean();
    const tours = await Tour.find({}).lean();

    const matchedPlants: Array<{ slug: string; heroUrl?: string; model3dUrl?: string }> = [];
    const matchedTours: Array<{ slug: string; coverUrl?: string }> = [];

    const cdnBase = process.env.R2_PUBLIC_URL || 'https://cdn.virtualherbalgarden.org';

    // Check against standard R2 key pattern
    for (const p of plants) {
      const heroKey = `plants/${p.slug}/hero.webp`;
      const modelKey = `models/${p.slug}.glb`;
      const heroUrl = `${cdnBase}/${heroKey}`;
      const modelUrl = `${cdnBase}/${modelKey}`;

      let updated = false;
      const updateData: Record<string, any> = {};

      if (!p.images || p.images.length === 0 || !p.images[0].url.includes(p.slug)) {
        updateData['images.0'] = {
          url: heroUrl,
          alt: `${p.commonName} hero botanical photo`,
          isPrimary: true,
          type: 'main',
        };
        updated = true;
      }

      if (!p.model3dUrl) {
        updateData.model3dUrl = modelUrl;
        updated = true;
      }

      if (updated) {
        matchedPlants.push({ slug: p.slug, heroUrl, model3dUrl: modelUrl });
        if (!dryRun) {
          await Plant.updateOne(
            { _id: p._id },
            {
              $set: {
                ...(updateData['images.0'] ? { images: [updateData['images.0'], ...(p.images || []).slice(1)] } : {}),
                ...(updateData.model3dUrl ? { model3dUrl: updateData.model3dUrl } : {}),
              },
            }
          );
        }
      }
    }

    for (const t of tours) {
      const coverKey = `tours/${t.slug}/cover.webp`;
      const coverUrl = `${cdnBase}/${coverKey}`;

      if (!t.coverImageUrl || !t.coverImageUrl.includes(t.slug)) {
        matchedTours.push({ slug: t.slug, coverUrl });
        if (!dryRun) {
          await Tour.updateOne({ _id: t._id }, { $set: { coverImageUrl: coverUrl } });
        }
      }
    }

    if (!dryRun) {
      await dbWriteService.logAudit(
        'plants',
        'LINK_R2_ASSETS',
        null,
        null,
        { linkedPlantsCount: matchedPlants.length, linkedToursCount: matchedTours.length },
        ctx
      );
    }

    return {
      dryRun,
      matchedPlantsCount: matchedPlants.length,
      matchedToursCount: matchedTours.length,
      matchedPlants,
      matchedTours,
    };
  }

  /**
   * Asset Coverage Report (hero image, gallery, GLB 3D model)
   */
  async getAssetCoverageReport() {
    const plants = await Plant.find({}, 'commonName scientificName slug images model3dUrl').lean();

    const report = plants.map((p) => {
      const hasHero = Array.isArray(p.images) && p.images.length > 0 && Boolean(p.images[0]?.url);
      const galleryCount = Array.isArray(p.images) ? Math.max(0, p.images.length - 1) : 0;
      const hasModel = Boolean(p.model3dUrl);

      return {
        id: p._id.toString(),
        slug: p.slug,
        commonName: p.commonName,
        scientificName: p.scientificName,
        hasHero,
        galleryCount,
        hasModel,
        isFullyCovered: hasHero && galleryCount > 0 && hasModel,
      };
    });

    const total = report.length;
    const heroCount = report.filter((r) => r.hasHero).length;
    const modelCount = report.filter((r) => r.hasModel).length;
    const fullyCoveredCount = report.filter((r) => r.isFullyCovered).length;

    return {
      totalPlants: total,
      heroCoveragePct: total > 0 ? Math.round((heroCount / total) * 100) : 0,
      modelCoveragePct: total > 0 ? Math.round((modelCount / total) * 100) : 0,
      fullyCoveredPct: total > 0 ? Math.round((fullyCoveredCount / total) * 100) : 0,
      checklist: report,
    };
  }

  /**
   * Auto-place 3D positions in spiral ring layout
   */
  async autoPlace3DPositions(ctx: DbWriteContext, dryRun = true) {
    const plants = await Plant.find({}).sort({ commonName: 1 }).lean();
    const placed: Array<{ slug: string; commonName: string; position: { x: number; y: number; z: number } }> = [];

    let ring = 1;
    let itemsInRing = 8;
    let angleStep = (2 * Math.PI) / itemsInRing;
    let currentIndexInRing = 0;

    for (let i = 0; i < plants.length; i++) {
      const p = plants[i];
      const radius = 6 + (ring - 1) * 4;
      const angle = currentIndexInRing * angleStep;

      const position = {
        x: Math.round(Math.cos(angle) * radius * 10) / 10,
        y: 0,
        z: Math.round(Math.sin(angle) * radius * 10) / 10,
      };

      placed.push({
        slug: p.slug,
        commonName: p.commonName,
        position,
      });

      if (!dryRun) {
        await Plant.updateOne(
          { _id: p._id },
          { $set: { placement3d: { position, scale: 1.0 } } }
        );
      }

      currentIndexInRing++;
      if (currentIndexInRing >= itemsInRing) {
        ring++;
        itemsInRing = 8 + ring * 4;
        angleStep = (2 * Math.PI) / itemsInRing;
        currentIndexInRing = 0;
      }
    }

    if (!dryRun) {
      await dbWriteService.logAudit(
        'plants',
        'AUTO_PLACE_3D',
        null,
        null,
        { placedCount: placed.length },
        ctx
      );
    }

    return {
      dryRun,
      totalPlaced: placed.length,
      coordinates: placed,
    };
  }

  /**
   * Find & replace in a text field across a collection
   */
  async findAndReplace(
    collectionKey: CollectionKey,
    field: string,
    findText: string,
    replaceText: string,
    ctx: DbWriteContext,
    dryRun = true
  ) {
    const reg = getRegistryItem(collectionKey);
    if (!reg) throw new AppError(`Collection not found: ${collectionKey}`, 404, 'NOT_FOUND');

    const regex = new RegExp(findText, 'gi');
    const docs = await reg.model.find({ [field]: { $regex: regex } }).lean();

    const previewList: Array<{ id: string; slug?: string; original: string; replaced: string }> = [];

    for (const d of docs) {
      const original = String((d as any)[field] || '');
      const replaced = original.replace(regex, replaceText);
      previewList.push({
        id: (d._id as Types.ObjectId).toString(),
        slug: (d as any).slug,
        original,
        replaced,
      });

      if (!dryRun) {
        await reg.model.updateOne({ _id: d._id }, { $set: { [field]: replaced } });
      }
    }

    if (!dryRun) {
      await dbWriteService.logAudit(
        collectionKey,
        'FIND_AND_REPLACE',
        null,
        null,
        { field, findText, replaceText, affectedCount: previewList.length },
        ctx
      );
    }

    return {
      dryRun,
      affectedCount: previewList.length,
      previews: previewList,
    };
  }

  /**
   * Normalize: trim strings, normalize casing of tags, dedupe tags & uses
   */
  async normalizeBotanicalData(ctx: DbWriteContext, dryRun = true) {
    const plants = await Plant.find({}).lean();
    let modifiedCount = 0;

    for (const p of plants) {
      const cleanTags = Array.from(new Set((p.tags || []).map((t: string) => t.trim().toLowerCase())));
      const cleanUses = Array.from(new Set((p.medicinalUses || []).map((u: string) => u.trim())));

      const changed =
        cleanTags.length !== (p.tags || []).length ||
        cleanUses.length !== (p.medicinalUses || []).length;

      if (changed) {
        modifiedCount++;
        if (!dryRun) {
          await Plant.updateOne(
            { _id: p._id },
            { $set: { tags: cleanTags, medicinalUses: cleanUses } }
          );
        }
      }
    }

    if (!dryRun) {
      await dbWriteService.logAudit('plants', 'NORMALIZE_DATA', null, null, { modifiedCount }, ctx);
    }

    return { dryRun, modifiedCount, totalChecked: plants.length };
  }

  /**
   * Get indexes for all collections
   */
  async getIndexesReport() {
    const items = getAllRegistryItems();
    const reports: Record<string, any[]> = {};

    for (const reg of items) {
      try {
        const indexes = await reg.model.collection.indexes();
        reports[reg.key] = indexes;
      } catch {
        reports[reg.key] = [];
      }
    }

    return reports;
  }

  /**
   * Sync indexes across all models
   */
  async syncIndexes(ctx: DbWriteContext) {
    if (ctx.actorRole !== 'SUPER_ADMIN') {
      throw new AppError('Only Super Admins can sync raw indexes', 403, 'FORBIDDEN');
    }

    const items = getAllRegistryItems();
    const results: Record<string, string> = {};

    for (const reg of items) {
      try {
        await reg.model.syncIndexes();
        results[reg.key] = 'synced';
      } catch (err: any) {
        results[reg.key] = `error: ${err.message}`;
      }
    }

    await dbWriteService.logAudit('featureflags', 'SYNC_INDEXES', null, null, results, ctx);
    return results;
  }
}

export const toolsService = new ToolsService();
