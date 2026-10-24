import { Request, Response } from 'express';
import { remedyService } from './remedy.service';
import { sendSuccess, sendCreated, AppError } from '../../core/utils/apiResponse';

export class RemedyController {
  async list(req: Request, res: Response) {
    const result = await remedyService.list(req.query as unknown as Parameters<typeof remedyService.list>[0]);
    sendSuccess(res, result.remedies, 200, result.meta);
  }

  async getBySlugOrId(req: Request, res: Response) {
    const identifier = req.params.slugOrId || req.params.slug || req.params.id;
    const isPreview = req.query.preview === '1' || req.query.preview === 'true';
    const remedy = await remedyService.getBySlugOrId(identifier, req.user?.sub, req.user?.role, isPreview);
    sendSuccess(res, remedy);
  }

  async getRelated(req: Request, res: Response) {
    const identifier = req.params.id || req.params.slug;
    const related = await remedyService.getRelated(identifier);
    sendSuccess(res, related);
  }

  async create(req: Request, res: Response) {
    const remedy = await remedyService.create(req.body, req.user!.sub);
    sendCreated(res, remedy);
  }

  async update(req: Request, res: Response) {
    const remedy = await remedyService.update(req.params.id, req.body, req.user!.sub, req.user!.role);
    sendSuccess(res, remedy);
  }

  async delete(req: Request, res: Response) {
    await remedyService.softDelete(req.params.id);
    sendSuccess(res, { message: 'Remedy deleted' });
  }

  async publish(req: Request, res: Response) {
    const remedy = await remedyService.publish(req.params.id);
    sendSuccess(res, remedy);
  }

  async uploadImage(req: Request, res: Response) {
    if (!req.file) throw new AppError('No image file provided', 400, 'NO_FILE');
    const result = await remedyService.uploadImage(
      req.params.id,
      req.file.buffer,
      req.user?.sub,
      req.user?.role,
    );
    sendSuccess(res, result);
  }

  async deleteImage(req: Request, res: Response) {
    await remedyService.deleteImage(req.params.id, req.user?.sub, req.user?.role);
    sendSuccess(res, { message: 'Remedy image removed' });
  }
}

export const remedyController = new RemedyController();
