import Plant from '../../library/Plant.model';
import Remedy from '../../remedies/Remedy.model';
import Tour from '../../tours/Tour.model';
import { isR2Configured, getR2Client } from '../../../core/storage/r2Storage';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { env } from '../../../core/config/env';

export interface ISyncCheckResult {
  orphans: Array<{ key: string; size: number; lastModified: Date; suggestedPlantSlug?: string }>;
  brokenLinks: Array<{ collection: string; id: string; name: string; field: string; url: string; key: string }>;
  wrongLocations: Array<{ key: string; currentFolder: string; expectedFolder: string }>;
  caseMismatches: Array<{ key: string; normalizedKey: string }>;
  stats: {
    totalR2Keys: number;
    totalDbLinks: number;
    orphanCount: number;
    brokenLinkCount: number;
  };
}

export interface ICoverageItem {
  id: string;
  name: string;
  slug: string;
  type: 'plant' | 'remedy' | 'tour';
  hasHero: boolean;
  galleryCount: number;
  hasGlb: boolean;
  hasLod: boolean;
  hasCover: boolean;
  missingItems: string[];
}

export class SyncService {
  private get bucket(): string {
    return env.R2_BUCKET_NAME || env.AWS_S3_BUCKET || 'herbal-garden';
  }

  async runSyncCheck(): Promise<ISyncCheckResult> {
    const brokenLinks: ISyncCheckResult['brokenLinks'] = [];
    const orphans: ISyncCheckResult['orphans'] = [];
    const wrongLocations: ISyncCheckResult['wrongLocations'] = [];
    const caseMismatches: ISyncCheckResult['caseMismatches'] = [];

    // 1. Gather all DB URLs
    const dbKeyMap = new Map<string, Array<{ collection: string; id: string; name: string; field: string; url: string }>>();

    const [plants, remedies, tours] = await Promise.all([
      Plant.find({ isDeleted: { $ne: true } }).select('_id commonName slug images model3dUrl modelUrl').lean(),
      Remedy.find({ isDeleted: { $ne: true } }).select('_id title slug image images').lean(),
      Tour.find({ isDeleted: { $ne: true } }).select('_id title slug coverImageUrl stops').lean(),
    ]);

    const registerDbUrl = (url: string | undefined | null, collection: string, id: string, name: string, field: string) => {
      if (!url || !url.startsWith('http')) return;
      const parsedKey = this.extractKeyFromUrl(url);
      if (!parsedKey) return;

      const existing = dbKeyMap.get(parsedKey) || [];
      existing.push({ collection, id, name, field, url });
      dbKeyMap.set(parsedKey, existing);
    };

    for (const p of plants) {
      if (p.model3dUrl) registerDbUrl(p.model3dUrl, 'plants', p._id.toString(), p.commonName, 'model3dUrl');
      if (p.modelUrl) registerDbUrl(p.modelUrl, 'plants', p._id.toString(), p.commonName, 'modelUrl');
      for (const img of p.images || []) {
        registerDbUrl(img.url, 'plants', p._id.toString(), p.commonName, 'images');
      }
    }

    for (const r of remedies) {
      if ((r as any).image) registerDbUrl((r as any).image, 'remedies', r._id.toString(), r.title, 'image');
      for (const img of r.images || []) {
        registerDbUrl(img.url, 'remedies', r._id.toString(), r.title, 'images');
      }
    }

    for (const t of tours) {
      if (t.coverImageUrl) registerDbUrl(t.coverImageUrl, 'tours', t._id.toString(), t.title, 'coverImageUrl');
      for (const s of (t.stops || [])) {
        if ((s as any).mediaUrl) registerDbUrl((s as any).mediaUrl, 'tours', t._id.toString(), t.title, 'stops.mediaUrl');
      }
    }

    // 2. Gather all R2 keys
    const r2KeySet = new Set<string>();
    const r2Objects: Array<{ Key: string; Size: number; LastModified: Date }> = [];

    if (isR2Configured()) {
      const client = getR2Client();
      let continuationToken: string | undefined;

      do {
        const res = await client.send(
          new ListObjectsV2Command({
            Bucket: this.bucket,
            ContinuationToken: continuationToken,
          })
        );

        for (const item of res.Contents || []) {
          if (!item.Key || item.Key.endsWith('.keep') || item.Key.startsWith('backups/') || item.Key.startsWith('trash/')) {
            continue;
          }
          r2KeySet.add(item.Key);
          r2Objects.push({
            Key: item.Key,
            Size: item.Size || 0,
            LastModified: item.LastModified || new Date(),
          });
        }
        continuationToken = res.NextContinuationToken;
      } while (continuationToken);
    }

    // 3. Detect broken links (in DB, not in R2)
    for (const [key, refs] of dbKeyMap.entries()) {
      if (!r2KeySet.has(key)) {
        for (const ref of refs) {
          brokenLinks.push({
            ...ref,
            key,
          });
        }
      }
    }

    // 4. Detect orphans (in R2, not in DB)
    for (const obj of r2Objects) {
      if (!dbKeyMap.has(obj.Key)) {
        // Check if slug can be inferred from path
        let suggestedSlug: string | undefined;
        const parts = obj.Key.split('/');
        if (parts[0] === 'plants' && parts[1]) {
          suggestedSlug = parts[1];
        }

        orphans.push({
          key: obj.Key,
          size: obj.Size,
          lastModified: obj.LastModified,
          suggestedPlantSlug: suggestedSlug,
        });
      }

      // Detect casing anomalies (e.g. .JPG vs .webp)
      if (obj.Key !== obj.Key.toLowerCase()) {
        caseMismatches.push({
          key: obj.Key,
          normalizedKey: obj.Key.toLowerCase(),
        });
      }
    }

    return {
      orphans,
      brokenLinks,
      wrongLocations,
      caseMismatches,
      stats: {
        totalR2Keys: r2KeySet.size,
        totalDbLinks: dbKeyMap.size,
        orphanCount: orphans.length,
        brokenLinkCount: brokenLinks.length,
      },
    };
  }

  /**
   * Coverage board per plant/remedy/tour
   */
  async getCoverageReport(): Promise<ICoverageItem[]> {
    const plants = await Plant.find({ isDeleted: { $ne: true } })
      .select('_id commonName slug images model3dUrl modelUrl')
      .lean();

    return plants.map((p) => {
      const hasHero = Boolean(p.images && p.images.length > 0 && p.images[0].url);
      const galleryCount = Math.max(0, (p.images || []).length - 1);
      const hasGlb = Boolean(p.model3dUrl || p.modelUrl);
      const hasLod = Boolean((p as any).modelUrl_lod1 || (p as any).modelUrl_lod2);

      const missing: string[] = [];
      if (!hasHero) missing.push('Hero Image');
      if (galleryCount === 0) missing.push('Gallery');
      if (!hasGlb) missing.push('3D GLB Model');

      return {
        id: p._id.toString(),
        name: p.commonName,
        slug: p.slug,
        type: 'plant',
        hasHero,
        galleryCount,
        hasGlb,
        hasLod,
        hasCover: false,
        missingItems: missing,
      };
    });
  }

  private extractKeyFromUrl(url: string): string | null {
    try {
      const parsed = new URL(url);
      const pathname = parsed.pathname.replace(/^\/+/, '');
      return pathname || null;
    } catch {
      // Relative URL or raw path
      return url.replace(/^\/+/, '') || null;
    }
  }
}

export const syncService = new SyncService();
export default syncService;
