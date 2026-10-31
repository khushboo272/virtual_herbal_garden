import crypto from 'crypto';
import Plant, {
  IPlant,
  ModelStatus,
  deriveVisualDefaults,
  IPlantVisual,
  IModelTransform,
} from '../library/Plant.model';
import { HEALTH_CATEGORIES } from '../library/health-categories';
import { ContentStatus } from '../../types';
import { getIO } from '../../core/socket';
import { logger } from '../../core/utils/logger';

export interface IShowcasePlant {
  id: string;
  slug: string;
  commonName: string;
  scientificName: string;
  plantType: string | null;
  healthCategories: string[];
  visual: Required<IPlantVisual>;
  modelUrl: string | null;
  lodUrl: string | null;
  modelVersion: number;
  modelStatus: ModelStatus;
  modelTransform: IModelTransform | null;
  globalPosition3D: { x: number; y: number; z: number } | null;
  thumbnail: string | null;
  createdAt: Date;
}

export class GardenShowcaseService {
  // Map of plantId -> list of { ip, at } for model error reports within 1 hour
  private recentModelReports = new Map<string, Array<{ ip: string; at: number }>>();

  /**
   * Derive health categories matching medicinalUses or tags
   */
  computePlantHealthCategories(plant: { medicinalUses?: string[]; tags?: string[] }): string[] {
    const uses = (plant.medicinalUses || []).map((u) => u.toLowerCase());
    const tags = (plant.tags || []).map((t) => t.toLowerCase());
    const combined = [...uses, ...tags].join(' ');

    const matched: string[] = [];
    for (const cat of HEALTH_CATEGORIES) {
      const hit = cat.keywords.some((kw) => combined.includes(kw.toLowerCase()));
      if (hit) {
        matched.push(cat.slug);
      }
    }
    return matched;
  }

  /**
   * Format any plant document to standard showcase response schema
   */
  formatShowcasePlant(plant: any): IShowcasePlant {
    const id = plant._id ? plant._id.toString() : plant.id || '';
    const visual = deriveVisualDefaults({
      plantType: plant.plantType,
      commonName: plant.commonName,
      scientificName: plant.scientificName,
      visual: plant.visual,
    });

    const modelStatus =
      plant.modelStatus ||
      (plant.modelUrl ? ModelStatus.READY : ModelStatus.NONE);

    let thumbnail: string | null = null;
    if (Array.isArray(plant.images) && plant.images.length > 0) {
      const primary = plant.images.find((img: any) => img.isPrimary);
      thumbnail = primary?.url || plant.images[0]?.url || null;
    }

    const globalPosition3D =
      plant.globalPosition3D && (plant.globalPosition3D.x !== 0 || plant.globalPosition3D.z !== 0)
        ? plant.globalPosition3D
        : plant.placement3d?.position || plant.globalPosition3D || null;

    return {
      id,
      slug: plant.slug,
      commonName: plant.commonName,
      scientificName: plant.scientificName,
      plantType: plant.plantType || null,
      healthCategories: this.computePlantHealthCategories(plant),
      visual,
      modelUrl: plant.modelUrl || null,
      lodUrl: plant.modelUrl_lod1 || null,
      modelVersion: plant.modelVersion || 0,
      modelStatus,
      modelTransform: plant.modelTransform || null,
      globalPosition3D,
      thumbnail,
      createdAt: plant.createdAt || new Date(),
    };
  }

  /**
   * Get all published plants for the 3D garden showcase
   */
  async getShowcasePlants(): Promise<{ plants: IShowcasePlant[]; etag: string }> {
    const plants = await Plant.find({
      isPublished: true,
      isDeleted: false,
      status: ContentStatus.PUBLISHED,
    })
      .sort({ createdAt: 1, _id: 1 })
      .lean();

    const formatted = plants.map((p) => this.formatShowcasePlant(p));
    const jsonStr = JSON.stringify(formatted);
    const etag = crypto.createHash('md5').update(jsonStr).digest('hex');

    return { plants: formatted, etag };
  }

  /**
   * Emit real-time plant updates over Socket.IO
   */
  emitGardenPlantChange(type: 'ADDED' | 'UPDATED' | 'REMOVED', plant: any): void {
    try {
      const formatted = this.formatShowcasePlant(plant);
      const io = getIO();
      io.emit('garden:plantsChanged', { type, plant: formatted });
    } catch {
      logger.debug('Socket.IO not initialized or unavailable, skipping garden:plantsChanged emit');
    }
  }

  /**
   * Record a 3D model render/decompression failure from client
   * Sets modelStatus = FAILED after 3 reports from distinct client IPs within 1 hour
   */
  async recordModelError(
    plantId: string,
    message: string,
    clientIp: string,
  ): Promise<{ plant: IPlant; modelStatus: ModelStatus; reportsCount: number }> {
    const plant = await Plant.findById(plantId);
    if (!plant || plant.isDeleted) {
      throw new Error('Plant not found');
    }

    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    let reports = this.recentModelReports.get(plantId) || [];
    // Prune entries older than 1 hour
    reports = reports.filter((r) => r.at >= oneHourAgo);
    reports.push({ ip: clientIp, at: now });
    this.recentModelReports.set(plantId, reports);

    const distinctIps = new Set(reports.map((r) => r.ip));
    const distinctCount = distinctIps.size;

    plant.lastModelError = {
      at: new Date(),
      message: message || 'Client WebGL/GLTF render failure',
    };

    if (distinctCount >= 3) {
      plant.modelStatus = ModelStatus.FAILED;
      logger.warn(
        `Plant ${plant.slug} (${plantId}) modelStatus marked as FAILED due to ${distinctCount} distinct failure reports in 1 hour.`,
      );
    }

    await plant.save();
    this.emitGardenPlantChange('UPDATED', plant);

    return {
      plant,
      modelStatus: plant.modelStatus || ModelStatus.READY,
      reportsCount: distinctCount,
    };
  }

  /**
   * Reset error history when a new model is uploaded
   */
  resetModelReports(plantId: string): void {
    this.recentModelReports.delete(plantId);
  }
}

export const gardenShowcaseService = new GardenShowcaseService();

