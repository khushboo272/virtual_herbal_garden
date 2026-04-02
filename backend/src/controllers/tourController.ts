import { Request, Response } from 'express';
import { tourService } from '../services/tourService';
import { sendSuccess, sendCreated } from '../utils/apiResponse';

export class TourController {
  async list(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const result = await tourService.list(page, limit);
    sendSuccess(res, result.tours, 200, result.meta);
  }

  async getBySlug(req: Request, res: Response) {
    const tour = await tourService.getBySlug(req.params.slug);
    sendSuccess(res, tour);
  }

  async create(req: Request, res: Response) {
    const tour = await tourService.create(req.body, req.user!.sub);
    sendCreated(res, tour);
  }

  async update(req: Request, res: Response) {
    const tour = await tourService.update(req.params.id, req.body);
    sendSuccess(res, tour);
  }

  async delete(req: Request, res: Response) {
    await tourService.softDelete(req.params.id);
    sendSuccess(res, { message: 'Tour deleted' });
  }

  async publish(req: Request, res: Response) {
    const tour = await tourService.publish(req.params.id);
    sendSuccess(res, tour);
  }
}

export const tourController = new TourController();
