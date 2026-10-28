import { Request, Response } from 'express';
import { tourService } from './tour.service';
import { sendSuccess, sendCreated, AppError } from '../../core/utils/apiResponse';
import { UserRole } from '../../types';
import { invalidateHomeCache } from '../home/home.service';

export class TourController {
  // Public
  async list(req: Request, res: Response) {
    const filters = {
      q: req.query.q as string,
      health: req.query.health as string,
      level: req.query.level as any,
      plant: req.query.plant as string,
      sort: req.query.sort as any,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 12,
    };
    const result = await tourService.list(filters);
    sendSuccess(res, result.tours, 200, result.meta);
  }

  async getBySlugOrId(req: Request, res: Response) {
    const { slugOrId } = req.params;
    const preview = req.query.preview === '1' || req.query.preview === 'true';
    const userRole = (req.user as any)?.role as UserRole | undefined;
    const tour = await tourService.getBySlugOrId(slugOrId, { preview, userRole });
    sendSuccess(res, tour);
  }

  // USER+ Progress
  async getMeProgress(req: Request, res: Response) {
    const userId = req.user!.sub;
    const progress = await tourService.getMeProgress(userId);
    sendSuccess(res, progress);
  }

  async getTourProgress(req: Request, res: Response) {
    const userId = req.user!.sub;
    const { slug } = req.params;
    const progress = await tourService.getTourProgress(userId, slug);
    sendSuccess(res, progress);
  }

  async completeCheckpoint(req: Request, res: Response) {
    const userId = req.user!.sub;
    const { slug, key } = req.params;
    const progress = await tourService.completeCheckpoint(userId, slug, key);
    sendSuccess(res, progress);
  }

  async submitQuiz(req: Request, res: Response) {
    const userId = req.user!.sub;
    const { slug, key } = req.params;
    const { answers } = req.body;
    const result = await tourService.submitQuiz(userId, slug, key, answers);
    sendSuccess(res, result);
  }

  async syncProgress(req: Request, res: Response) {
    const userId = req.user!.sub;
    const { slug } = req.params;
    const { completedKeys } = req.body;
    const progress = await tourService.syncProgress(userId, slug, completedKeys);
    sendSuccess(res, progress);
  }

  async rateTour(req: Request, res: Response) {
    const userId = req.user!.sub;
    const { slug } = req.params;
    const { rating, comment } = req.body;
    const result = await tourService.rateTour(userId, slug, rating, comment);
    sendSuccess(res, result);
  }

  async restartTour(req: Request, res: Response) {
    const userId = req.user!.sub;
    const { slug } = req.params;
    const result = await tourService.restartTour(userId, slug);
    sendSuccess(res, result);
  }

  // ADMIN+
  async getAdminList(_req: Request, res: Response) {
    const list = await tourService.getAdminList();
    sendSuccess(res, list);
  }

  async getAdminAnalytics(_req: Request, res: Response) {
    const analytics = await tourService.getAdminAnalytics();
    sendSuccess(res, analytics);
  }

  async getTourAnalytics(req: Request, res: Response) {
    const { id } = req.params;
    const analytics = await tourService.getTourAnalytics(id);
    sendSuccess(res, analytics);
  }

  async create(req: Request, res: Response) {
    const tour = await tourService.create(req.body, req.user!.sub);
    sendCreated(res, tour);
  }

  async update(req: Request, res: Response) {
    const tour = await tourService.update(req.params.id, req.body);
    invalidateHomeCache();
    sendSuccess(res, tour);
  }

  async publish(req: Request, res: Response) {
    const tour = await tourService.publish(req.params.id);
    invalidateHomeCache();
    sendSuccess(res, tour);
  }

  async unpublish(req: Request, res: Response) {
    const tour = await tourService.unpublish(req.params.id);
    invalidateHomeCache();
    sendSuccess(res, tour);
  }

  async delete(req: Request, res: Response) {
    await tourService.softDelete(req.params.id);
    invalidateHomeCache();
    sendSuccess(res, { message: 'Tour deleted successfully' });
  }

  async uploadCover(req: Request, res: Response) {
    if (!req.file) throw new AppError('No image file uploaded', 400, 'NO_FILE');
    const result = await tourService.uploadTourCover(req.params.id, req.file.buffer);
    sendSuccess(res, result);
  }

  async deleteCover(req: Request, res: Response) {
    await tourService.deleteTourCover(req.params.id);
    sendSuccess(res, { message: 'Cover removed successfully' });
  }

  async uploadCheckpointImage(req: Request, res: Response) {
    if (!req.file) throw new AppError('No image file uploaded', 400, 'NO_FILE');
    const { id, key } = req.params;
    const result = await tourService.uploadCheckpointImage(id, key, req.file.buffer);
    sendSuccess(res, result);
  }
}

export const tourController = new TourController();
