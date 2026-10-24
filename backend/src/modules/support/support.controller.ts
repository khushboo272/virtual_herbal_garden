import { Request, Response } from 'express';
import { supportService } from './support.service';
import { sendSuccess, sendCreated } from '../../core/utils/apiResponse';

export class SupportController {
  async create(req: Request, res: Response) {
    const request = await supportService.create(req.user!.sub, req.body);
    sendCreated(res, request);
  }

  async getMine(req: Request, res: Response) {
    const requests = await supportService.getMine(req.user!.sub);
    sendSuccess(res, requests);
  }
}

export const supportController = new SupportController();
