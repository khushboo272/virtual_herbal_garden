import { Request, Response } from 'express';
import { plantService } from '../services/plantService';
import { storageService } from '../services/storageService';
import { validateImageMagicBytes } from '../utils/imageProcessor';
import { sendSuccess, sendCreated, AppError } from '../utils/apiResponse';
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
    sendCreated(res, plant);
  }

  async update(req: Request, res: Response) {
    const plant = await plantService.update(req.params.id, req.body, req.user!.sub, req.user!.role);
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

    const Plant = (await import('../models/Plant')).default;
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
}

export const plantController = new PlantController();
