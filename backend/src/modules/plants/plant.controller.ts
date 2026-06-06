import { Request, Response } from 'express';
import { plantService } from './plant.service';
import { storageService } from '../../core/utils/storageService';
import { validateImageMagicBytes } from '../../core/utils/imageProcessor';
import { sendSuccess, sendCreated, AppError } from '../../core/utils/apiResponse';
import crypto from 'crypto';

export class PlantController {
  async list(req: Request, res: Response) {
    const result = await plantService.list(req.query as unknown as Parameters<typeof plantService.list>[0]);
    sendSuccess(res, result.plants, 200, result.meta);
  }

  async featured(_req: Request, res: Response) {
    const plants = await plantService.getFeatured();
    sendSuccess(res, plants);
  }

  async autocomplete(req: Request, res: Response) {
    const q = req.query.q as string || '';
    const results = await plantService.autocomplete(q);
    sendSuccess(res, results);
  }

  async getBySlug(req: Request, res: Response) {
    const plant = await plantService.getBySlug(req.params.slug, req.user?.sub);
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

    const images = await Promise.all(
      files.map(async (file) => {
        const mime = validateImageMagicBytes(file.buffer);
        if (!mime) throw new AppError('Invalid image format', 400, 'INVALID_FORMAT');
        return storageService.uploadPlantImage(file.buffer, req.params.id, crypto.randomUUID());
      }),
    );

    const Plant = (await import('./Plant.model')).default;
    await Plant.findByIdAndUpdate(req.params.id, { $push: { images: { $each: images } } });
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

  async uploadModel(req: Request, res: Response) {
    const { id } = req.params;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    const Plant = (await import('./Plant.model')).default;
    const plant = await Plant.findById(id);
    if (!plant) throw new AppError('Plant not found', 404, 'NOT_FOUND');

    const { uploadToR2 } = await import('../../lib/r2Client');

    if (files?.['model']?.[0]) {
      const url = await uploadToR2(
        files['model'][0].buffer,
        `assets-for-r2/models/plants/${plant.slug}-lod0.glb`,
        'model/gltf-binary'
      );
      plant.modelUrl = url;
    }

    plant.uploadedBy = req.user!.sub as unknown as import('mongoose').Types.ObjectId;
    plant.uploadedAt = new Date();
    await plant.save();

    req.app.get('io')?.emit('plantModelUpdated', { plantId: id, plantName: plant.commonName });

    sendSuccess(res, plant);
  }

  async uploadModelLod(req: Request, res: Response) {
    const { id } = req.params;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    const Plant = (await import('./Plant.model')).default;
    const plant = await Plant.findById(id);
    if (!plant) throw new AppError('Plant not found', 404, 'NOT_FOUND');

    const { uploadToR2 } = await import('../../lib/r2Client');

    if (files?.['model_lod1']?.[0]) {
      const url = await uploadToR2(
        files['model_lod1'][0].buffer,
        `assets-for-r2/models/plants/${plant.slug}-lod1.glb`,
        'model/gltf-binary'
      );
      plant.modelUrl_lod1 = url;
    }

    if (files?.['model_lod2']?.[0]) {
      const url = await uploadToR2(
        files['model_lod2'][0].buffer,
        `assets-for-r2/models/plants/${plant.slug}-lod2.glb`,
        'model/gltf-binary'
      );
      plant.modelUrl_lod2 = url;
    }

    plant.uploadedBy = req.user!.sub as unknown as import('mongoose').Types.ObjectId;
    plant.uploadedAt = new Date();
    await plant.save();

    sendSuccess(res, plant);
  }

  async updateGardenPosition(req: Request, res: Response) {
    const { id } = req.params;
    const { globalPosition3D, botanicalBed, isVisibleInGarden } = req.body;

    const Plant = (await import('./Plant.model')).default;
    const plant = await Plant.findById(id);
    if (!plant) throw new AppError('Plant not found', 404, 'NOT_FOUND');

    if (globalPosition3D !== undefined) plant.globalPosition3D = globalPosition3D;
    if (botanicalBed !== undefined) plant.botanicalBed = botanicalBed;
    if (isVisibleInGarden !== undefined) plant.isVisibleInGarden = isVisibleInGarden;

    await plant.save();

    req.app.get('io')?.emit('plantPositionUpdated', { 
      plantId: id, 
      position: plant.globalPosition3D,
      isVisible: plant.isVisibleInGarden 
    });

    sendSuccess(res, plant);
  }

  async deleteModel(req: Request, res: Response) {
    const { id } = req.params;

    const Plant = (await import('./Plant.model')).default;
    const plant = await Plant.findById(id);
    if (!plant) throw new AppError('Plant not found', 404, 'NOT_FOUND');

    const { deleteFromR2 } = await import('../../lib/r2Client');
    const r2UrlPrefix = `${process.env.R2_PUBLIC_URL}/`;

    if (plant.modelUrl) {
      await deleteFromR2(plant.modelUrl.replace(r2UrlPrefix, ''));
      plant.modelUrl = null;
    }
    if (plant.modelUrl_lod1) {
      await deleteFromR2(plant.modelUrl_lod1.replace(r2UrlPrefix, ''));
      plant.modelUrl_lod1 = null;
    }
    if (plant.modelUrl_lod2) {
      await deleteFromR2(plant.modelUrl_lod2.replace(r2UrlPrefix, ''));
      plant.modelUrl_lod2 = null;
    }

    await plant.save();

    req.app.get('io')?.emit('plantModelUpdated', { plantId: id, plantName: plant.commonName });

    sendSuccess(res, { message: '3D models deleted successfully' });
  }

  async getGardenPlants(req: Request, res: Response) {
    const Plant = (await import('./Plant.model')).default;
    const plants = await Plant.find({ isVisibleInGarden: true, isDeleted: false })
      .select('commonName scientificName slug modelUrl modelUrl_lod1 modelUrl_lod2 globalPosition3D botanicalBed categories tags color placement3d images shortDescription partsUsed')
      .lean();
    sendSuccess(res, plants);
  }
}

export const plantController = new PlantController();
