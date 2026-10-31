import { Types } from 'mongoose';

export interface SeedBundleInput {
  categories?: any[];
  plants?: any[];
  plants_extra?: any[];
  remedies?: any[];
  tours?: any[];
  [key: string]: any;
}

export class SeedAdapter {
  /**
   * Normalize an _id: keep if valid 24-hex ObjectId string or Types.ObjectId, else generate a new ObjectId.
   */
  normalizeId(idVal: any): Types.ObjectId {
    if (idVal && Types.ObjectId.isValid(idVal)) {
      return new Types.ObjectId(idVal);
    }
    return new Types.ObjectId();
  }

  /**
   * Merge plants_extra rows by slug into plants
   */
  mergePlantsExtra(plants: any[] = [], plantsExtra: any[] = []): any[] {
    if (!plantsExtra || plantsExtra.length === 0) return plants;

    const extraMap = new Map<string, any>();
    for (const item of plantsExtra) {
      if (item && item.slug) {
        extraMap.set(item.slug.toLowerCase().trim(), item);
      }
    }

    return plants.map((plant) => {
      const slug = (plant.slug || '').toLowerCase().trim();
      const extra = extraMap.get(slug);
      if (!extra) return plant;

      return {
        ...plant,
        aliases: extra.aliases || plant.aliases || [],
        precautions: extra.precautions || plant.precautions || [],
        references: extra.references || plant.references || [],
        visual: {
          ...(plant.visual || {}),
          ...(extra.visual || {}),
        },
      };
    });
  }

  /**
   * Adapt categories
   */
  adaptCategory(item: any, importingUserId: string): any {
    return {
      _id: this.normalizeId(item._id),
      name: item.name?.trim(),
      slug: (item.slug || '').toLowerCase().trim(),
      description: item.description || '',
      sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : 0,
      createdBy: item.createdBy ? this.normalizeId(item.createdBy) : new Types.ObjectId(importingUserId),
    };
  }

  /**
   * Adapt plants (allows images: [] and model3dUrl: "")
   */
  adaptPlant(item: any, importingUserId: string, categoryIdMap: Map<string, Types.ObjectId>): any {
    // Resolve category slugs or IDs
    const resolvedCategories: Types.ObjectId[] = [];
    if (Array.isArray(item.categories)) {
      for (const catRef of item.categories) {
        if (!catRef) continue;
        const catStr = String(catRef).trim();
        if (categoryIdMap.has(catStr.toLowerCase())) {
          resolvedCategories.push(categoryIdMap.get(catStr.toLowerCase())!);
        } else if (Types.ObjectId.isValid(catStr)) {
          resolvedCategories.push(new Types.ObjectId(catStr));
        }
      }
    }

    return {
      _id: this.normalizeId(item._id),
      commonName: item.commonName?.trim() || '',
      scientificName: item.scientificName?.trim() || '',
      slug: (item.slug || '').toLowerCase().trim(),
      family: item.family?.trim() || 'Unspecified',
      description: item.description || '',
      shortDescription: item.shortDescription || '',
      medicinalUses: Array.isArray(item.medicinalUses) ? item.medicinalUses : [],
      partsUsed: Array.isArray(item.partsUsed) ? item.partsUsed : [],
      toxicityLevel: item.toxicityLevel || 'NONE',
      ayurvedicNames: Array.isArray(item.ayurvedicNames) ? item.ayurvedicNames : [],
      regionNative: Array.isArray(item.regionNative) ? item.regionNative : [],
      growingConditions: item.growingConditions || {},
      images: Array.isArray(item.images)
        ? item.images.map((img: any) => ({
            ...img,
            type: typeof img.type === 'string' ? img.type.toLowerCase() : 'main',
          }))
        : [],
      model3dUrl: item.model3dUrl || '', // allows ""
      categories: resolvedCategories,
      tags: Array.isArray(item.tags) ? item.tags : [],
      isFeatured: Boolean(item.isFeatured),
      isPublished: item.isPublished !== undefined ? Boolean(item.isPublished) : true,
      placement3d: item.placement3d || undefined,
      visual: item.visual || undefined,
      aliases: Array.isArray(item.aliases) ? item.aliases : [],
      precautions: Array.isArray(item.precautions) ? item.precautions : [],
      references: Array.isArray(item.references)
        ? item.references.map((r: any) =>
            typeof r === 'object' && r !== null
              ? `${r.title || ''}${r.url ? ` (${r.url})` : ''}`.trim()
              : String(r)
          )
        : [],
      createdBy: item.createdBy ? this.normalizeId(item.createdBy) : new Types.ObjectId(importingUserId),
    };
  }

  /**
   * Adapt remedies (resolves plant slugs or IDs)
   */
  adaptRemedy(item: any, importingUserId: string, plantIdMap: Map<string, Types.ObjectId>): any {
    // Resolve plant references
    const resolvedPlants: Types.ObjectId[] = [];
    if (Array.isArray(item.plants)) {
      for (const pRef of item.plants) {
        if (!pRef) continue;
        const pStr = String(pRef).trim();
        if (plantIdMap.has(pStr.toLowerCase())) {
          resolvedPlants.push(plantIdMap.get(pStr.toLowerCase())!);
        } else if (Types.ObjectId.isValid(pStr)) {
          resolvedPlants.push(new Types.ObjectId(pStr));
        }
      }
    }

    // Resolve ingredients plantId
    const resolvedIngredients = Array.isArray(item.ingredients)
      ? item.ingredients.map((ing: any) => {
          let plantId = ing.plantId;
          if (plantId) {
            const pStr = String(plantId).trim();
            if (plantIdMap.has(pStr.toLowerCase())) {
              plantId = plantIdMap.get(pStr.toLowerCase())!;
            } else if (Types.ObjectId.isValid(pStr)) {
              plantId = new Types.ObjectId(pStr);
            }
          }
          return {
            ...ing,
            plantId,
          };
        })
      : [];

    return {
      _id: this.normalizeId(item._id),
      title: item.title?.trim() || '',
      slug: (item.slug || '').toLowerCase().trim(),
      description: item.description || '',
      plants: resolvedPlants,
      dosage: item.dosage || '',
      ingredients: resolvedIngredients,
      preparationSteps: Array.isArray(item.preparationSteps) ? item.preparationSteps : [],
      contraindications: Array.isArray(item.contraindications) ? item.contraindications : [],
      difficultyLevel: item.difficultyLevel || 'EASY',
      preparationTime: typeof item.preparationTime === 'number' ? item.preparationTime : 10,
      tags: Array.isArray(item.tags) ? item.tags : [],
      isPublished: item.isPublished !== undefined ? Boolean(item.isPublished) : true,
      createdBy: item.createdBy ? this.normalizeId(item.createdBy) : new Types.ObjectId(importingUserId),
    };
  }

  /**
   * Adapt tours (maps tour stops[] -> both model stops[] and checkpoints[])
   */
  adaptTour(
    item: any,
    importingUserId: string,
    plantIdMap: Map<string, Types.ObjectId>,
    plantSlugMap: Map<string, string>
  ): any {
    const rawStops = Array.isArray(item.stops) ? item.stops : [];

    const adaptedStops = rawStops.map((stop: any, idx: number) => {
      let plantId = stop.plant;
      if (plantId) {
        const pStr = String(plantId).trim();
        if (plantIdMap.has(pStr.toLowerCase())) {
          plantId = plantIdMap.get(pStr.toLowerCase())!;
        } else if (Types.ObjectId.isValid(pStr)) {
          plantId = new Types.ObjectId(pStr);
        }
      }

      return {
        order: typeof stop.order === 'number' ? stop.order : idx + 1,
        plant: plantId,
        title: stop.title || `Stop ${idx + 1}`,
        description: stop.description || '',
        mediaUrl: stop.mediaUrl || undefined,
        mediaType: stop.mediaType || undefined,
        coordinates3d: stop.coordinates3d || stop.position || undefined,
      };
    });

    // Also map to checkpoints structure if checkpoints are not provided
    const adaptedCheckpoints = Array.isArray(item.checkpoints) && item.checkpoints.length > 0
      ? item.checkpoints
      : rawStops.map((stop: any, idx: number) => {
          let plantSlug = '';
          if (stop.plant) {
            const pStr = String(stop.plant).trim();
            plantSlug = plantSlugMap.get(pStr.toLowerCase()) || (Types.ObjectId.isValid(pStr) ? '' : pStr);
          }

          return {
            key: `checkpoint-${idx + 1}`,
            order: typeof stop.order === 'number' ? stop.order : idx + 1,
            title: stop.title || `Stop ${idx + 1}`,
            summary: stop.description?.slice(0, 150) || '',
            body: stop.description || '',
            durationMinutes: 3,
            plantSlugs: plantSlug ? [plantSlug] : [],
            remedySlugs: [],
            keyTakeaways: [],
            audioUrl: stop.audioUrl || stop.mediaUrl || undefined,
          };
        });

    return {
      _id: this.normalizeId(item._id),
      slug: (item.slug || '').toLowerCase().trim(),
      title: item.title?.trim() || '',
      description: item.description || '',
      summary: item.summary || item.description?.slice(0, 200) || '',
      difficulty: item.difficulty || 'EASY',
      estimatedDuration: typeof item.estimatedDuration === 'number' ? item.estimatedDuration : 15,
      coverImageUrl: item.coverImageUrl || null,
      stops: adaptedStops,
      checkpoints: adaptedCheckpoints,
      isPublished: item.isPublished !== undefined ? Boolean(item.isPublished) : true,
      createdBy: item.createdBy ? this.normalizeId(item.createdBy) : new Types.ObjectId(importingUserId),
    };
  }
}

export const seedAdapter = new SeedAdapter();
