import { Request, Response } from 'express';
import { sendSuccess } from '../../core/utils/apiResponse';
import { buildHomePayload } from './home.service';

export async function homeController(_req: Request, res: Response): Promise<void> {
  const payload = await buildHomePayload();
  sendSuccess(res, payload);
}
