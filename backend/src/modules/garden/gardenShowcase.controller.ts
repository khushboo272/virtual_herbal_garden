import { Request, Response } from 'express';
import { gardenShowcaseService } from './gardenShowcase.service';
import { sendSuccess } from '../../core/utils/apiResponse';
import { AppError } from '../../core/errors/AppError';

export class GardenShowcaseController {
  async getShowcase(req: Request, res: Response): Promise<void> {
    const { plants, etag } = await gardenShowcaseService.getShowcasePlants();

    res.setHeader('ETag', `"${etag}"`);
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');

    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch && (ifNoneMatch === `"${etag}"` || ifNoneMatch === etag)) {
      res.status(304).end();
      return;
    }

    sendSuccess(res, plants);
  }

  async reportModelError(req: Request, res: Response): Promise<void> {
    const { plantId, message } = req.body;
    if (!plantId) {
      throw new AppError('plantId is required', 400);
    }

    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = (
      typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : req.ip || req.socket.remoteAddress || 'unknown'
    );

    const result = await gardenShowcaseService.recordModelError(
      plantId,
      message,
      clientIp,
    );

    sendSuccess(res, {
      modelStatus: result.modelStatus,
      reportsCount: result.reportsCount,
    });
  }
}

export const gardenShowcaseController = new GardenShowcaseController();
