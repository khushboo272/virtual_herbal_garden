import { Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IntegrityIssue, IntegrityReport } from '../types';
import Plant from '../../library/Plant.model';
import Category from '../../library/Category.model';
import Remedy from '../../remedies/Remedy.model';
import Tour from '../../tours/Tour.model';

export class IntegrityService {
  private ignoredIssues = new Set<string>();

  /**
   * Run full data integrity check
   */
  async runCheck(): Promise<IntegrityReport> {
    const issues: IntegrityIssue[] = [];

    // 1. Fetch reference lookups
    const [allCategories, allPlants, allRemedies, allTours] = await Promise.all([
      Category.find({}, '_id slug name').lean(),
      Plant.find({}, '_id slug commonName scientificName isPublished categories placement3d images medicinalUses').lean(),
      Remedy.find({}, '_id slug title isPublished plants contraindications').lean(),
      Tour.find({}, '_id slug title isPublished stops checkpoints').lean(),
    ]);

    const catIdSet = new Set(allCategories.map((c) => c._id.toString()));
    const plantIdSet = new Set(allPlants.map((p) => p._id.toString()));
    const plantMap = new Map(allPlants.map((p) => [p._id.toString(), p]));

    // ── Check 1: Orphan References in Plants (missing Category) ──
    for (const p of allPlants) {
      if (Array.isArray(p.categories)) {
        for (const catId of p.categories) {
          if (!catIdSet.has(catId.toString())) {
            issues.push({
              id: uuidv4(),
              severity: 'error',
              code: 'ORPHAN_CATEGORY_REF',
              category: 'orphans',
              collectionName: 'plants',
              docId: p._id.toString(),
              slug: p.slug,
              field: 'categories',
              message: `Plant "${p.commonName}" references non-existent category (${catId})`,
              fixable: true,
              autoFixAction: 'remove_orphan_category',
              autoFixPayload: { categoryId: catId.toString() },
            });
          }
        }
      }
    }

    // ── Check 2: Orphan References in Remedies (missing Plant) ──
    for (const r of allRemedies) {
      if (Array.isArray(r.plants)) {
        for (const pId of r.plants) {
          if (!plantIdSet.has(pId.toString())) {
            issues.push({
              id: uuidv4(),
              severity: 'error',
              code: 'ORPHAN_PLANT_REF',
              category: 'orphans',
              collectionName: 'remedies',
              docId: r._id.toString(),
              slug: r.slug,
              field: 'plants',
              message: `Remedy "${r.title}" references non-existent plant ID (${pId})`,
              fixable: true,
              autoFixAction: 'remove_orphan_plant',
              autoFixPayload: { plantId: pId.toString() },
            });
          }
        }
      }

      // Medical safety warning: remedies without contraindications
      if (!r.contraindications || r.contraindications.length === 0) {
        issues.push({
          id: uuidv4(),
          severity: 'warn',
          code: 'MISSING_CONTRAINDICATIONS',
          category: 'medical_safety',
          collectionName: 'remedies',
          docId: r._id.toString(),
          slug: r.slug,
          field: 'contraindications',
          message: `Medical Safety Alert: Remedy "${r.title}" has no listed contraindications`,
          fixable: false,
        });
      }
    }

    // ── Check 3: Orphan References in Tours (stops missing Plant) ──
    for (const t of allTours) {
      if (Array.isArray(t.stops)) {
        for (const stop of t.stops) {
          if (stop.plant && !plantIdSet.has(stop.plant.toString())) {
            issues.push({
              id: uuidv4(),
              severity: 'error',
              code: 'ORPHAN_TOUR_PLANT_REF',
              category: 'orphans',
              collectionName: 'tours',
              docId: t._id.toString(),
              slug: t.slug,
              field: 'stops.plant',
              message: `Tour "${t.title}" stop "${stop.title}" references non-existent plant (${stop.plant})`,
              fixable: true,
              autoFixAction: 'remove_orphan_tour_stop',
              autoFixPayload: { stopOrder: stop.order },
            });
          } else if (stop.plant && t.isPublished) {
            const linkedPlant = plantMap.get(stop.plant.toString());
            if (linkedPlant && !linkedPlant.isPublished) {
              issues.push({
                id: uuidv4(),
                severity: 'warn',
                code: 'PUBLISHED_TOUR_UNPUBLISHED_PLANT',
                category: 'medical_safety',
                collectionName: 'tours',
                docId: t._id.toString(),
                slug: t.slug,
                field: 'stops.plant',
                message: `Published tour "${t.title}" contains unpublished plant "${linkedPlant.commonName}"`,
                fixable: true,
                autoFixAction: 'publish_linked_plant',
                autoFixPayload: { plantId: linkedPlant._id.toString() },
              });
            }
          }
        }
      }
    }

    // ── Check 4: Published Plants Missing Images or Medicinal Uses ──
    for (const p of allPlants) {
      if (p.isPublished) {
        if (!p.images || p.images.length === 0) {
          issues.push({
            id: uuidv4(),
            severity: 'warn',
            code: 'PUBLISHED_PLANT_NO_IMAGE',
            category: 'assets',
            collectionName: 'plants',
            docId: p._id.toString(),
            slug: p.slug,
            field: 'images',
            message: `Published plant "${p.commonName}" has no images attached`,
            fixable: true,
            autoFixAction: 'unpublish_plant',
          });
        }

        if (!p.medicinalUses || p.medicinalUses.length === 0) {
          issues.push({
            id: uuidv4(),
            severity: 'warn',
            code: 'PUBLISHED_PLANT_NO_MEDICINAL_USES',
            category: 'schema',
            collectionName: 'plants',
            docId: p._id.toString(),
            slug: p.slug,
            field: 'medicinalUses',
            message: `Published plant "${p.commonName}" has no medicinal uses listed`,
            fixable: false,
          });
        }
      }

      // Check 3D placement overlap (< 1 unit distance)
      if (p.placement3d?.position) {
        const posA = p.placement3d.position;
        for (const other of allPlants) {
          if (other._id.toString() === p._id.toString()) continue;
          if (other.placement3d?.position) {
            const posB = other.placement3d.position;
            const dist = Math.sqrt(
              Math.pow(posA.x - posB.x, 2) + Math.pow(posA.z - posB.z, 2)
            );
            if (dist < 1.0) {
              issues.push({
                id: uuidv4(),
                severity: 'warn',
                code: 'OVERLAPPING_3D_PLACEMENT',
                category: '3d_placement',
                collectionName: 'plants',
                docId: p._id.toString(),
                slug: p.slug,
                field: 'placement3d.position',
                message: `3D placement overlap: "${p.commonName}" is within ${dist.toFixed(2)} units of "${other.commonName}"`,
                fixable: true,
                autoFixAction: 'auto_relocate_plant_3d',
              });
              break; // avoid duplicate warning for same pair
            }
          }
        }
      } else {
        issues.push({
          id: uuidv4(),
          severity: 'info',
          code: 'MISSING_3D_PLACEMENT',
          category: '3d_placement',
          collectionName: 'plants',
          docId: p._id.toString(),
          slug: p.slug,
          field: 'placement3d',
          message: `Plant "${p.commonName}" has no 3D coordinate placement set`,
          fixable: true,
          autoFixAction: 'assign_default_3d_position',
        });
      }
    }

    // ── Check 5: Duplicate Slugs or Scientific Names ──
    const scientificNameMap = new Map<string, string[]>();
    for (const p of allPlants) {
      const sn = (p.scientificName || '').trim().toLowerCase();
      if (sn) {
        const list = scientificNameMap.get(sn) || [];
        list.push(p.commonName);
        scientificNameMap.set(sn, list);
      }
    }
    for (const [sn, names] of scientificNameMap.entries()) {
      if (names.length > 1) {
        issues.push({
          id: uuidv4(),
          severity: 'error',
          code: 'DUPLICATE_SCIENTIFIC_NAME',
          category: 'duplicates',
          collectionName: 'plants',
          docId: '',
          message: `Duplicate scientific name "${sn}" used across plants: ${names.join(', ')}`,
          fixable: false,
        });
      }
    }

    // Filter out ignored issues
    const activeIssues = issues.filter((iss) => !this.ignoredIssues.has(iss.id));

    const errorsCount = activeIssues.filter((i) => i.severity === 'error').length;
    const warningsCount = activeIssues.filter((i) => i.severity === 'warn').length;
    const infoCount = activeIssues.filter((i) => i.severity === 'info').length;

    // Calculate health score (0 - 100)
    const deduction = errorsCount * 10 + warningsCount * 3 + infoCount * 0.5;
    const healthScore = Math.max(0, Math.min(100, Math.round(100 - deduction)));

    return {
      timestamp: new Date().toISOString(),
      healthScore,
      totalIssues: activeIssues.length,
      errorsCount,
      warningsCount,
      infoCount,
      issues: activeIssues,
    };
  }

  /**
   * Preview and execute an auto-fix for an issue
   */
  async applyFix(issue: IntegrityIssue, _ctx?: any): Promise<{ success: boolean; message: string }> {
    if (!issue.fixable || !issue.autoFixAction) {
      throw new Error('This issue cannot be automatically fixed');
    }

    if (issue.autoFixAction === 'remove_orphan_category' && issue.docId && issue.autoFixPayload?.categoryId) {
      await Plant.updateOne(
        { _id: issue.docId },
        { $pull: { categories: new Types.ObjectId(issue.autoFixPayload.categoryId) } }
      );
      return { success: true, message: `Removed dangling category reference from plant` };
    }

    if (issue.autoFixAction === 'remove_orphan_plant' && issue.docId && issue.autoFixPayload?.plantId) {
      await Remedy.updateOne(
        { _id: issue.docId },
        { $pull: { plants: new Types.ObjectId(issue.autoFixPayload.plantId) } }
      );
      return { success: true, message: `Removed dangling plant reference from remedy` };
    }

    if (issue.autoFixAction === 'unpublish_plant' && issue.docId) {
      await Plant.updateOne({ _id: issue.docId }, { $set: { isPublished: false } });
      return { success: true, message: `Set plant to draft (unpublished)` };
    }

    if (issue.autoFixAction === 'publish_linked_plant' && issue.autoFixPayload?.plantId) {
      await Plant.updateOne({ _id: issue.autoFixPayload.plantId }, { $set: { isPublished: true } });
      return { success: true, message: `Published linked plant` };
    }

    if (issue.autoFixAction === 'assign_default_3d_position' && issue.docId) {
      const count = await Plant.countDocuments({ 'placement3d.position': { $exists: true } });
      const angle = (count * 45 * Math.PI) / 180;
      const radius = 6 + Math.floor(count / 8) * 3;
      const position = {
        x: Math.round(Math.cos(angle) * radius * 10) / 10,
        y: 0,
        z: Math.round(Math.sin(angle) * radius * 10) / 10,
      };
      await Plant.updateOne({ _id: issue.docId }, { $set: { placement3d: { position, scale: 1.0 } } });
      return { success: true, message: `Assigned non-overlapping 3D placement coordinates` };
    }

    return { success: false, message: 'No handler found for auto-fix action' };
  }

  /**
   * Persist ignored issue ID
   */
  ignoreIssue(issueId: string) {
    this.ignoredIssues.add(issueId);
    return { success: true };
  }
}

export const integrityService = new IntegrityService();
