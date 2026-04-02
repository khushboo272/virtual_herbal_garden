import { Request, Response } from 'express';
import { detectionService } from '../services/detectionService';
import { storageService } from '../services/storageService';
import { validateImageMagicBytes } from '../utils/imageProcessor';
import { sendSuccess, sendAccepted, AppError } from '../utils/apiResponse';

export class DetectionController {
  async detect(req: Request, res: Response) {
    const file = req.file;
    if (!file) throw new AppError('No image provided', 400, 'NO_FILE');

    const mime = validateImageMagicBytes(file.buffer);
    if (!mime) throw new AppError('Invalid image format', 400, 'INVALID_FORMAT');

    // Temporary jobId for S3 path
    const mongoose = await import('mongoose');
    const jobId = new mongoose.Types.ObjectId().toString();
    const imageUrl = await storageService.uploadDetectionImage(file.buffer, jobId);
    const detection = await detectionService.createDetection(req.user!.sub, imageUrl);

    sendAccepted(res, { jobId: detection._id, status: detection.status });
  }

  async getDetection(req: Request, res: Response) {
    const detection = await detectionService.getDetection(req.params.jobId, req.user!.sub);
    sendSuccess(res, detection);
  }

  async getHistory(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await detectionService.getHistory(req.user!.sub, page, limit);
    sendSuccess(res, result.detections, 200, result.meta);
  }

  async addFeedback(req: Request, res: Response) {
    const detection = await detectionService.addFeedback(req.params.id, req.user!.sub, req.body);
    sendSuccess(res, detection);
  }

  async getStats(_req: Request, res: Response) {
    const stats = await detectionService.getStats();
    sendSuccess(res, stats);
  }
}

export const detectionController = new DetectionController();
