import { Request, Response } from 'express';
import { remedyService } from '../services/remedyService';
import { sendSuccess, sendCreated } from '../utils/apiResponse';

export class RemedyController {
  async list(req: Request, res: Response) {
    const result = await remedyService.list(req.query as unknown as Parameters<typeof remedyService.list>[0]);
    sendSuccess(res, result.remedies, 200, result.meta);
  }

  async getBySlug(req: Request, res: Response) {
    const remedy = await remedyService.getBySlug(req.params.slug);
    sendSuccess(res, remedy);
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
}

export const remedyController = new RemedyController();
