import { Request, Response } from 'express';
import { sendSuccess } from '../../core/utils/apiResponse';
import { buildHomePayload } from './home.service';

export async function homeController(_req: Request, res: Response): Promise<void> {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  const payload = await buildHomePayload();
  sendSuccess(res, payload);
}
