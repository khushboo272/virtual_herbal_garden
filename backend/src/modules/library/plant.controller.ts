import { Request, Response } from 'express';
import { plantService } from './plant.service';
import { storageService } from '../../core/utils/storageService';
import { validateImageMagicBytes } from '../../core/utils/imageProcessor';
import { sendSuccess, sendCreated, AppError } from '../../core/utils/apiResponse';
import { notificationService } from '../notifications/notification.service';
import { NotificationType } from '../../types';
import User from '../users/User.model';
import PlantRegistrationRequest from './PlantRegistrationRequest.model';
import crypto from 'crypto';
import mongoose from 'mongoose';

function buildPlantQuery(id: string) {
  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  const normalizedSlug = id.toLowerCase().replace(/_/g, '-');
  const slugVariants = Array.from(new Set([id, normalizedSlug, id.replace(/-/g, '_')]));
  return isObjectId
    ? { $or: [{ _id: id }, ...slugVariants.map((s) => ({ slug: s }))] }
    : { $or: slugVariants.map((s) => ({ slug: s })) };
}

const missingPlantAlertCache = new Map<string, number>();

export function clearMissingPlantAlertCache() {
  missingPlantAlertCache.clear();
}

export class PlantController {
  async list(req: Request, res: Response) {
    // req.query has been validated + coerced by the plantQuerySchema middleware
    const q = req.query as Record<string, unknown>;
    const result = await plantService.list({
      page: q.page as number,
      limit: q.limit as number,
      q: q.q as string | undefined,
      search: q.search as string | undefined,
      medicinalUse: q.medicinalUse as string[] | undefined,
      health: q.health as string | undefined,
      region: q.region as string | undefined,
      type: q.type as string | undefined,
      category: q.category as string | undefined,
      family: q.family as string | undefined,
      tags: q.tags as string | undefined,
      sort: q.sort as string | undefined,
    });
    sendSuccess(res, result.plants, 200, result.meta);
  }

  async featured(_req: Request, res: Response) {
    const plants = await plantService.getFeatured();
    sendSuccess(res, plants);
  }

  async autocomplete(req: Request, res: Response) {
    const q = (req.query.q as string) || '';
    const results = await plantService.autocomplete(q);
    sendSuccess(res, results);
  }

  async getBySlug(req: Request, res: Response) {
    const isPreview = req.query.preview === '1' || req.query.preview === 'true';
    const plant = await plantService.getBySlug(req.params.slug, req.user?.sub, req.user?.role, isPreview);
    sendSuccess(res, plant);
  }

  async getRelated(req: Request, res: Response) {
    const related = await plantService.getRelated(req.params.id);
    sendSuccess(res, related);
  }

  async create(req: Request, res: Response) {
    const plant = await plantService.create(req.body, req.user!.sub);
    req.app.get('io')?.emit('plant:created', { plantId: plant._id, name: plant.commonName });
    sendCreated(res, plant);
  }

  async update(req: Request, res: Response) {
    const plant = await plantService.update(req.params.id, req.body, req.user!.sub, req.user!.role);
    req.app.get('io')?.emit('plant:updated', { plantId: plant._id, name: plant.commonName });
    sendSuccess(res, plant);
  }

  async publish(req: Request, res: Response) {
    const plant = await plantService.publish(req.params.id);
    sendSuccess(res, plant);
  }

  async feature(req: Request, res: Response) {
    const plant = await plantService.feature(req.params.id);
    sendSuccess(res, plant);
  }

  async delete(req: Request, res: Response) {
    await plantService.softDelete(req.params.id);
    sendSuccess(res, { message: 'Plant deleted' });
  }

  async uploadImages(req: Request, res: Response) {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files?.length) throw new AppError('No images provided', 400, 'NO_FILES');

    const Plant = (await import('./Plant.model')).default;
    const plantQuery = buildPlantQuery(req.params.id);
    const plant = await Plant.findOne({ ...plantQuery, isDeleted: { $ne: true } });
    if (!plant || plant.isDeleted) throw new AppError('Plant not found', 404, 'NOT_FOUND');

    const { assertCanModifyContent } = await import('../../core/policies/contentOwnership');
    assertCanModifyContent(plant, req.user!.sub, req.user!.role, 'upload');

    const images = await Promise.all(
      files.map(async (file) => {
        const mime = validateImageMagicBytes(file.buffer);
        if (!mime) throw new AppError('Invalid image format', 400, 'INVALID_FORMAT');
        return storageService.uploadPlantImage(file.buffer, plant._id.toString(), crypto.randomUUID());
      }),
    );

    await Plant.findByIdAndUpdate(plant._id, { $push: { images: { $each: images } } });
    sendCreated(res, images);
  }

  async getReviews(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await plantService.getReviews(req.params.id, page, limit);
    sendSuccess(res, result.reviews, 200, result.meta);
  }

  async createReview(req: Request, res: Response) {
    const review = await plantService.createReview(req.params.id, req.user!.sub, req.body);
    sendCreated(res, review);
  }

  // ── 3D Garden / Model Upload ─────────────────────────────────────────────
  // TODO: move to 3d-garden module — these routes are kept here for now
  // because PUT /plants/:id/model, /model-lod, PATCH /:id/garden-position,
  // DELETE /:id/model must remain at their current URLs until the 3D garden
  // module is ready to own them.

  async uploadModel(req: Request, res: Response) {
    const { id } = req.params;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    const Plant = (await import('./Plant.model')).default;
    const { ModelStatus } = await import('./Plant.model');
    const plantQuery = buildPlantQuery(id);
    const plant = await Plant.findOne({ ...plantQuery, isDeleted: { $ne: true } });
    if (!plant) throw new AppError('Plant not found', 404, 'NOT_FOUND');

    const { assertCanModifyContent } = await import('../../core/policies/contentOwnership');
    assertCanModifyContent(plant, req.user!.sub, req.user!.role, 'upload');

    const file = files?.['model']?.[0];
    if (file) {
      // Validate glTF binary magic bytes: 'glTF'
      if (file.buffer.length < 4 || file.buffer.subarray(0, 4).toString('ascii') !== 'glTF') {
        throw new AppError('Invalid GLB file format: missing binary glTF magic bytes', 400);
      }
      if (file.size > 25 * 1024 * 1024) {
        throw new AppError('Model file exceeds maximum limit of 25 MB', 400);
      }

      let url: string;
      try {
        const { uploadToR2 } = await import('../../lib/r2Client');
        url = await uploadToR2(
          file.buffer,
          `assets-for-r2/models/plants/${plant.slug}-lod0.glb`,
          'model/gltf-binary',
        );
      } catch (r2Err) {
        // Fallback to local filesystem storage if R2 is offline or credentials unset
        const fs = await import('fs/promises');
        const path = await import('path');
        const uploadDir = path.join(process.cwd(), 'uploads', 'models', 'plants');
        await fs.mkdir(uploadDir, { recursive: true });
        const filePath = path.join(uploadDir, `${plant.slug}-lod0.glb`);
        await fs.writeFile(filePath, file.buffer);
        url = `/uploads/models/plants/${plant.slug}-lod0.glb`;
      }

      plant.modelUrl = url;
      plant.modelVersion = Date.now();
      plant.modelStatus = ModelStatus.READY;
      plant.lastModelError = undefined;

      // Handle optional modelTransform in body
      if (req.body.modelTransform) {
        try {
          const transform =
            typeof req.body.modelTransform === 'string'
              ? JSON.parse(req.body.modelTransform)
              : req.body.modelTransform;
          plant.modelTransform = { ...plant.modelTransform, ...transform };
        } catch {
          // ignore parsing error if already handled
        }
      }
      if (req.body.targetHeightM !== undefined) {
        plant.modelTransform = plant.modelTransform || {};
        plant.modelTransform.targetHeightM = parseFloat(req.body.targetHeightM);
      }
      if (req.body.rotationY !== undefined) {
        plant.modelTransform = plant.modelTransform || {};
        plant.modelTransform.rotationY = parseFloat(req.body.rotationY);
      }
      if (req.body.offsetY !== undefined) {
        plant.modelTransform = plant.modelTransform || {};
        plant.modelTransform.offsetY = parseFloat(req.body.offsetY);
      }
      if (req.body.scale !== undefined) {
        plant.modelTransform = plant.modelTransform || {};
        plant.modelTransform.scale = parseFloat(req.body.scale);
      }
    }

    plant.uploadedBy = req.user!.sub as unknown as import('mongoose').Types.ObjectId;
    plant.uploadedAt = new Date();
    await plant.save();

    const { gardenShowcaseService } = await import('../garden/gardenShowcase.service');
    gardenShowcaseService.resetModelReports(plant._id.toString());
    gardenShowcaseService.emitGardenPlantChange('UPDATED', plant);

    req.app.get('io')?.emit('plantModelUpdated', { plantId: plant._id.toString(), plantName: plant.commonName });
    sendSuccess(res, plant);
  }

  async uploadModelLod(req: Request, res: Response) {
    const { id } = req.params;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    const Plant = (await import('./Plant.model')).default;
    const plantQuery = buildPlantQuery(id);
    const plant = await Plant.findOne({ ...plantQuery, isDeleted: { $ne: true } });
    if (!plant) throw new AppError('Plant not found', 404, 'NOT_FOUND');

    if (files?.['model_lod1']?.[0]) {
      const f1 = files['model_lod1'][0];
      if (f1.buffer.length < 4 || f1.buffer.subarray(0, 4).toString('ascii') !== 'glTF') {
        throw new AppError('Invalid GLB file format: missing binary glTF magic bytes for lod1', 400);
      }
      let url: string;
      try {
        const { uploadToR2 } = await import('../../lib/r2Client');
        url = await uploadToR2(
          f1.buffer,
          `assets-for-r2/models/plants/${plant.slug}-lod1.glb`,
          'model/gltf-binary',
        );
      } catch {
        const fs = await import('fs/promises');
        const path = await import('path');
        const uploadDir = path.join(process.cwd(), 'uploads', 'models', 'plants');
        await fs.mkdir(uploadDir, { recursive: true });
        await fs.writeFile(path.join(uploadDir, `${plant.slug}-lod1.glb`), f1.buffer);
        url = `/uploads/models/plants/${plant.slug}-lod1.glb`;
      }
      plant.modelUrl_lod1 = url;
    }

    if (files?.['model_lod2']?.[0]) {
      const f2 = files['model_lod2'][0];
      if (f2.buffer.length < 4 || f2.buffer.subarray(0, 4).toString('ascii') !== 'glTF') {
        throw new AppError('Invalid GLB file format: missing binary glTF magic bytes for lod2', 400);
      }
      let url: string;
      try {
        const { uploadToR2 } = await import('../../lib/r2Client');
        url = await uploadToR2(
          f2.buffer,
          `assets-for-r2/models/plants/${plant.slug}-lod2.glb`,
          'model/gltf-binary',
        );
      } catch {
        const fs = await import('fs/promises');
        const path = await import('path');
        const uploadDir = path.join(process.cwd(), 'uploads', 'models', 'plants');
        await fs.mkdir(uploadDir, { recursive: true });
        await fs.writeFile(path.join(uploadDir, `${plant.slug}-lod2.glb`), f2.buffer);
        url = `/uploads/models/plants/${plant.slug}-lod2.glb`;
      }
      plant.modelUrl_lod2 = url;
    }

    plant.uploadedBy = req.user!.sub as unknown as import('mongoose').Types.ObjectId;
    plant.uploadedAt = new Date();
    plant.modelVersion = Date.now();
    await plant.save();

    const { gardenShowcaseService } = await import('../garden/gardenShowcase.service');
    gardenShowcaseService.emitGardenPlantChange('UPDATED', plant);

    sendSuccess(res, plant);
  }

  async updateGardenPosition(req: Request, res: Response) {
    const { id } = req.params;
    const { globalPosition3D, botanicalBed, isVisibleInGarden } = req.body;

    const Plant = (await import('./Plant.model')).default;
    const plantQuery = buildPlantQuery(id);
    const plant = await Plant.findOne({ ...plantQuery, isDeleted: { $ne: true } });
    if (!plant) throw new AppError('Plant not found', 404, 'NOT_FOUND');

    if (globalPosition3D !== undefined) plant.globalPosition3D = globalPosition3D;
    if (botanicalBed !== undefined) plant.botanicalBed = botanicalBed;
    if (isVisibleInGarden !== undefined) plant.isVisibleInGarden = isVisibleInGarden;

    await plant.save();

    const { gardenShowcaseService } = await import('../garden/gardenShowcase.service');
    gardenShowcaseService.emitGardenPlantChange('UPDATED', plant);

    req.app.get('io')?.emit('plantPositionUpdated', {
      plantId: plant._id.toString(),
      position: plant.globalPosition3D,
      isVisible: plant.isVisibleInGarden,
    });

    sendSuccess(res, plant);
  }

  async deleteModel(req: Request, res: Response) {
    const { id } = req.params;

    const Plant = (await import('./Plant.model')).default;
    const { ModelStatus } = await import('./Plant.model');
    const plantQuery = buildPlantQuery(id);
    const plant = await Plant.findOne({ ...plantQuery, isDeleted: { $ne: true } });
    if (!plant) throw new AppError('Plant not found', 404, 'NOT_FOUND');

    if (plant.modelUrl) {
      if (plant.modelUrl.startsWith('/uploads/')) {
        const fs = await import('fs/promises');
        const path = await import('path');
        try {
          await fs.unlink(path.join(process.cwd(), plant.modelUrl));
        } catch {
          // ignore if already deleted
        }
      } else {
        try {
          const { deleteFromR2 } = await import('../../lib/r2Client');
          const r2UrlPrefix = `${process.env.R2_PUBLIC_URL}/`;
          await deleteFromR2(plant.modelUrl.replace(r2UrlPrefix, ''));
        } catch {
          // ignore R2 error
        }
      }
      plant.modelUrl = null;
    }
    if (plant.modelUrl_lod1) {
      if (plant.modelUrl_lod1.startsWith('/uploads/')) {
        const fs = await import('fs/promises');
        const path = await import('path');
        try {
          await fs.unlink(path.join(process.cwd(), plant.modelUrl_lod1));
        } catch {
          // ignore
        }
      } else {
        try {
          const { deleteFromR2 } = await import('../../lib/r2Client');
          const r2UrlPrefix = `${process.env.R2_PUBLIC_URL}/`;
          await deleteFromR2(plant.modelUrl_lod1.replace(r2UrlPrefix, ''));
        } catch {
          // ignore
        }
      }
      plant.modelUrl_lod1 = null;
    }
    if (plant.modelUrl_lod2) {
      if (plant.modelUrl_lod2.startsWith('/uploads/')) {
        const fs = await import('fs/promises');
        const path = await import('path');
        try {
          await fs.unlink(path.join(process.cwd(), plant.modelUrl_lod2));
        } catch {
          // ignore
        }
      } else {
        try {
          const { deleteFromR2 } = await import('../../lib/r2Client');
          const r2UrlPrefix = `${process.env.R2_PUBLIC_URL}/`;
          await deleteFromR2(plant.modelUrl_lod2.replace(r2UrlPrefix, ''));
        } catch {
          // ignore
        }
      }
      plant.modelUrl_lod2 = null;
    }

    plant.modelVersion = Date.now();
    plant.modelStatus = ModelStatus.NONE;
    await plant.save();

    const { gardenShowcaseService } = await import('../garden/gardenShowcase.service');
    gardenShowcaseService.emitGardenPlantChange('UPDATED', plant);

    req.app.get('io')?.emit('plantModelUpdated', { plantId: plant._id.toString(), plantName: plant.commonName });
    sendSuccess(res, { message: '3D models deleted successfully' });
  }

  async getGardenPlants(_req: Request, res: Response) {
    const Plant = (await import('./Plant.model')).default;
    const plants = await Plant.find({ isVisibleInGarden: true, isDeleted: false })
      .select(
        'commonName scientificName slug modelUrl modelUrl_lod1 modelUrl_lod2 globalPosition3D botanicalBed categories tags color placement3d images shortDescription partsUsed',
      )
      .lean();
    sendSuccess(res, plants);
  }

  async reportMissingPlantSearch(req: Request, res: Response) {
    const { query, scientificName, family } = req.body || {};
    const key = (scientificName || query || '').trim().toLowerCase();
    const now = Date.now();
    const lastAlert = missingPlantAlertCache.get(key);

    if (lastAlert && now - lastAlert < 3600000) {
      return res.status(200).json({
        success: true,
        deduplicated: true,
        message: 'Botanical team has already been alerted for this plant recently.',
      });
    }

    if (key) {
      missingPlantAlertCache.set(key, now);
    }

    const plantName = query || scientificName || 'Unknown species';
    const subtitle = scientificName && scientificName !== plantName ? ` (${scientificName})` : '';
    const familyStr = family ? ` [Family: ${family}]` : '';

    await notificationService.notifyBotanistsAndAdmins(
      NotificationType.SYSTEM,
      `Plant Not in Dataset: ${plantName}`,
      `A visitor searched for "${plantName}"${subtitle}${familyStr}, which is not currently available in our herbal dataset. Please conduct botanical research and apply for new plant registration.`,
      `/dashboard/moderation?type=requests`,
    );

    return res.status(200).json({
      success: true,
      message: 'Botanists and administrators have been alerted to research and register this plant.',
    });
  }

  async submitPlantRegistrationRequest(req: Request, res: Response) {
    const { commonName, scientificName, family, description, medicinalUses, notes, imageUrl } = req.body || {};
    if (!commonName) {
      throw new AppError('Common name is required for plant registration request', 400, 'VALIDATION_ERROR');
    }

    let senderName = 'A dedicated visitor';
    let requesterEmail = '';
    const userId = (req.user as any)?.sub || (req.user as any)?._id;
    if (userId) {
      const user = await User.findById(userId).select('displayName email').lean();
      if (user) {
        senderName = user.displayName || user.email || senderName;
        requesterEmail = user.email || '';
      }
    }

    const createdRequest = await PlantRegistrationRequest.create({
      commonName: commonName.trim(),
      scientificName: scientificName ? scientificName.trim() : '',
      family: family ? family.trim() : '',
      description: description ? description.trim() : '',
      medicinalUses: Array.isArray(medicinalUses) ? medicinalUses : (medicinalUses ? [medicinalUses] : []),
      imageUrl: imageUrl || '',
      notes: notes ? notes.trim() : '',
      requestedBy: userId || null,
      requesterName: senderName,
      requesterEmail,
      status: 'PENDING',
    });

    const usesStr = Array.isArray(medicinalUses)
      ? medicinalUses.join(', ')
      : (medicinalUses || 'General wellness / traditional herb');
    const noteStr = notes ? ` Notes: ${notes}` : '';
    const familyStr = family ? ` [Family: ${family}]` : '';

    await notificationService.notifyBotanistsAndAdmins(
      NotificationType.SYSTEM,
      `New Plant Registration Request: ${commonName}`,
      `${senderName} requested registration for "${commonName}"${scientificName ? ` (${scientificName})` : ''}${familyStr}.${noteStr} Description: ${description || 'N/A'}. Uses: ${usesStr}. Please review and register in herbal catalog.`,
      `/dashboard/moderation?type=requests`,
    );

    const motivationText = `I noticed ${commonName}${scientificName ? ` (${scientificName})` : ''} was missing from the Virtual Herbal Garden catalog and requested its registration. I would love to contribute verified botanical knowledge, research, and medicinal documentation as an official botanist contributor.`;
    const qualificationsText = `Botanical enthusiast and contributor experienced with medicinal plant documentation, including ${commonName}.`;

    const responsePayload = {
      success: true,
      message: 'Thank you for contributing to the Virtual Herbal Garden! Our botanical team and administrators have been notified to review and register this plant.',
      requestId: createdRequest._id,
      request: createdRequest,
      redirect: {
        url: '/dashboard/become-contributor',
        prefill: {
          motivation: motivationText,
          qualifications: qualificationsText,
        },
      },
    };

    return res.status(201).json({
      ...responsePayload,
      data: responsePayload,
    });
  }

  async getPlantRegistrationRequests(req: Request, res: Response) {
    const status = (req.query.status as string) || undefined;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const q = (req.query.q as string) || '';

    const filter: Record<string, unknown> = {};
    if (status) {
      filter.status = status;
    }
    if (q.trim()) {
      filter.$or = [
        { commonName: { $regex: q.trim(), $options: 'i' } },
        { scientificName: { $regex: q.trim(), $options: 'i' } },
        { requesterName: { $regex: q.trim(), $options: 'i' } },
      ];
    }

    const [requests, total] = await Promise.all([
      PlantRegistrationRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('requestedBy', 'displayName email avatarUrl')
        .lean(),
      PlantRegistrationRequest.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    sendSuccess(res, requests, 200, { page, limit, total, totalPages });
  }

  async updatePlantRegistrationRequestStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status, adminNotes } = req.body || {};
    const userId = (req.user as any)?.sub || (req.user as any)?._id;

    if (!['PENDING', 'RESEARCHING', 'CATALOGED', 'DISMISSED'].includes(status)) {
      throw new AppError('Invalid status value', 400, 'VALIDATION_ERROR');
    }

    const updated = await PlantRegistrationRequest.findByIdAndUpdate(
      id,
      {
        status,
        ...(adminNotes !== undefined && { adminNotes }),
        reviewedBy: userId,
      },
      { new: true },
    );

    if (!updated) {
      throw new AppError('Registration request not found', 404, 'NOT_FOUND');
    }

    sendSuccess(res, updated);
  }
}

export const plantController = new PlantController();
